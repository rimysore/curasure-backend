const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { Client } = require('@duosecurity/duo_universal');
const User = require('../models/UserData');
const router = express.Router();

// Configure Nodemailer to use Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',  // Use Gmail service
  auth: {
    user: process.env.MAIL_USER,  // Your Gmail address
    pass: process.env.MAIL_PASS   // Your Google app password
  }
});

// Return reCAPTCHA site key to frontend
router.get('/recaptcha-key', (req, res) => {
  const siteKey = process.env.RECAPTCHA_SITE_KEY;
  if (!siteKey) {
    return res.status(500).json({ message: 'reCAPTCHA site key not configured' });
  }
  res.json({ siteKey });
});

// A simple regex to validate email format
function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

router.post('/register', async (req, res) => {
  const { email, password, name, role, theme } = req.body;
  // Validate email format
  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }
  // Check for missing required fields
  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists' });
  }

  // Store user data in session before verification
  req.session.pendingUser = { email, password, name, role, theme };

  // Simplified registration process without Duo
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({
    email,
    name,
    password: hashedPassword,
    role,
    theme: theme || 'default'
  });

  await newUser.save();

  // Send email notification
  transporter.sendMail({
    from: `Support <${process.env.MAIL_USER}>`,
    to: newUser.email,
    subject: 'Registration Successful',
    html: `<p>Welcome, ${newUser.name}!</p><p>Your account has been created.</p>`
  });

  res.json({ message: 'Registration successful! Redirecting to login...' });
});

// Login Route
router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ message: 'Please provide email, password, and role' });
  }

  try {
    const user = await User.findOne({ email, role });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: 'Invalid email, password, or role' });
    }

    // Generate JWT token for login
    const token = jwt.sign(
      { _id: user._id, email: user.email, role: user.role, theme: user.theme },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

// Middleware to verify JWT
const authMiddleware = (req, res, next) => {
  const token = req.query.token || req.headers['authorization']?.split(' ')[1]; // Check token in query or Authorization header
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(400).json({ message: 'Invalid token.' });
  }
};

// Get User Profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email }).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update User Profile
router.put('/me', authMiddleware, async (req, res) => {
  const { name, theme } = req.body;

  try {
    // Validate input
    if (!name && !theme) {
      return res.status(400).json({ message: 'Please provide name or theme to update' });
    }

    // Prepare update object
    const updateData = {};
    if (name) updateData.name = name;
    if (theme) updateData.theme = theme;

    // Find and update the user, creating the document if it doesn't exist
    const user = await User.findOneAndUpdate(
      { email: req.user.email },
      { $set: updateData },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Forgot Password (Send Email with Reset Link)
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpires = Date.now() + 3600000;
    await user.save();

    const resetUrl = `${process.env.BASE_URL}/curasure/reset-password?token=${resetToken}`;
    transporter.sendMail({
      from: `Support <${process.env.MAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `<p>You requested a password reset.</p><p>Click <a href="${resetUrl}">here</a> to reset your password.</p><p>This link expires in 1 hour.</p>`
    }, (error) => {
      if (error) return res.status(500).json({ message: 'Failed to send reset email' });
      res.json({ message: 'Password reset email sent successfully' });
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const user = await User.findOne({ resetToken: token, resetTokenExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

module.exports = router;
