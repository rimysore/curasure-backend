const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const passport = require('passport');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

const router = express.Router();
const USERS_FILE = path.join(__dirname, '../users.json');

// Function to validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

// Configure Nodemailer to use Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',  // Use Gmail service
  auth: {
    user: process.env.MAIL_USER,  // Your Gmail address
    pass: process.env.MAIL_PASS   // Your Google app password
  }
});

// Middleware to verify JWT
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
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

// Register Route with Email Validation
router.post('/register', async (req, res) => {
  const { email, password, role } = req.body;

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  let users = readUsersFromFile();
  if (users.find(user => user.email === email)) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ email, password: hashedPassword, role });
  writeUsersToFile(users);

  res.status(201).json({ message: 'User registered successfully' });
});

// Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  let users = readUsersFromFile();
  const user = users.find(user => user.email === email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ message: 'Invalid email or password' });
  }

  const token = jwt.sign({ email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ message: 'Login successful', token });
});

// Get User Profile
router.get('/me', authMiddleware, (req, res) => {
  let users = readUsersFromFile();
  const user = users.find(u => u.email === req.user.email);
  if (!user) return res.status(404).json({ message: 'User not found.' });
  
  res.json({ user });
});

// Forgot Password (Send Email with Reset Link)
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  let users = readUsersFromFile();
  const user = users.find(user => user.email === email);
  if (!user) return res.status(400).json({ message: 'User not found' });

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetToken = resetToken;
  user.resetTokenExpires = Date.now() + 3600000; // Expires in 1 hour
  writeUsersToFile(users);

  const resetUrl = `${process.env.BASE_URL}/api/auth/reset-password?token=${resetToken}`;

  // Send Email with Gmail SMTP credentials
  transporter.sendMail({
    from: `"Support" <${process.env.MAIL_USER}>`,  // Use Gmail user as the sender
    to: email,
    subject: 'Password Reset Request',
    html: `<p>You requested a password reset.</p>
           <p>Click <a href="${resetUrl}">here</a> to reset your password.</p>
           <p>This link expires in 1 hour.</p>`
  }, (error, info) => {
    if (error) {
      console.error('Email sending failed:', error);
      return res.status(500).json({ message: 'Failed to send reset email' });
    }
    res.json({ message: 'Password reset email sent successfully' });
  });
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  let users = readUsersFromFile();
  const user = users.find(u => u.resetToken === token && u.resetTokenExpires > Date.now());
  if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

  user.password = await bcrypt.hash(newPassword, 10);
  delete user.resetToken;
  delete user.resetTokenExpires;
  writeUsersToFile(users);

  res.json({ message: 'Password reset successful' });
});

// Google OAuth Route
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// Google OAuth Callback Route
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
  const token = jwt.sign({ email: req.user.email, role: req.user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ message: 'Google login successful', token });
});

// Function to read users from the file
const readUsersFromFile = () => {
  try {
    if (!fs.existsSync(USERS_FILE)) return [];
    return JSON.parse(fs.readFileSync(USERS_FILE));
  } catch (error) {
    console.error('Error reading users file:', error);
    return [];
  }
};

// Function to write users to the file
const writeUsersToFile = (users) => {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error writing users file:', error);
  }
};

module.exports = router;
