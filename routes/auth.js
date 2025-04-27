const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const passport = require('passport');
const { OAuth2Client } = require('google-auth-library');
const { Client } = require('@duosecurity/duo_universal');



const mongoose = require('mongoose');
const User = require('../models/UserData');


const router = express.Router();
const USERS_FILE = path.join(__dirname, '../users.json');
const axios = require('axios');





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

// Google OAuth Route
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
  }));
  
// Google OAuth Callback Route
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
    if (!req.user || !req.user.token) {
      return res.status(500).json({ message: 'Google authentication failed' });
    }
  
    // Return token in JSON response
    res.json({ message: 'Google OAuth successful', token: req.user.token });
  });
  
  // Success route to display token on screen
  router.get('/success', (req, res) => {
    const token = req.query.token;
    if (!token) {
      return res.status(400).send('<h2>Authentication failed. No token received.</h2>');
    }
  
    res.send(`
      <html>
        <head>
          <title>Google OAuth Success</title>
        </head>
        <body>
          <h2>Google OAuth Successful</h2>
          <p>Your token:</p>
          <textarea rows="5" cols="60">${token}</textarea>
          <br/>
          <p>Copy and use this token for authentication.</p>
        </body>
      </html>
    `);
  });
  
  module.exports = router;

// Middleware to verify JWT
const authMiddleware = (req, res, next) => {
  //const token = req.header('Authorization')?.replace('Bearer ', '');
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
    // Store user data in session before Duo verification
    req.session.pendingUser = { email, password, name, role, theme };
    // 🔐 Create Duo Client with env variable for redirect URL
    console.log("Session data before Duo auth:", req.session);
 
    const duo = new Client({
      clientId: process.env.DUO_CLIENT_ID,
      clientSecret: process.env.DUO_CLIENT_SECRET,
      apiHost: process.env.DUO_API_HOSTNAME,
      redirectUrl: process.env.DUO_REGISTER_CALLBACK_URL  // ✅ Updated
    });
    // Generate state for Duo
    const state = duo.generateState();
    req.session.duoState = state;
    // Create Duo Auth URL
    console.log("Saved Duo state in session:", req.session.duoState);
    const authUrl = duo.createAuthUrl(email, state);
    // Respond with Duo Auth URL
    res.json({ duoAuthUrl: authUrl });
  });
  
  
  
// Assuming you are using the same Duo client initialization in backend

router.get('/duo/callback', async (req, res) => {
  const { duo_code: code, state } = req.query;
  console.log("Duo Callback Triggered");
  console.log("Code:", code);
  console.log("State:", state);

  // Ensure the session contains the duoState and pendingUser
  const pendingUser = req.session.pendingUser;
  const sessionDuoState = req.session.duoState;

  

  try {
    const duo = new Client({
      clientId: process.env.DUO_CLIENT_ID,
      clientSecret: process.env.DUO_CLIENT_SECRET,
      apiHost: process.env.DUO_API_HOSTNAME,
      redirectUrl: process.env.DUO_REGISTER_CALLBACK_URL,
    });

    // Exchange the code for the 2FA result
    await duo.exchangeAuthorizationCodeFor2FAResult(code, pendingUser.email);

    const hashedPassword = await bcrypt.hash(pendingUser.password, 10);
    const newUser = new User({
      email: pendingUser.email,
      name: pendingUser.name,
      password: hashedPassword,
      role: pendingUser.role,
      theme: pendingUser.theme || 'default',
    });
    await newUser.save();

    // Clear session data only after successful registration
    req.session.pendingUser = null;
    req.session.duoState = null;

    // Send email notification
    transporter.sendMail({
      from: `Support <${process.env.MAIL_USER}>`,
      to: newUser.email,
      subject: 'Registration Successful',
      html: `<p>Welcome, ${newUser.name}!</p><p>Your account has been created.</p>`
    });

    // Redirect the user to the frontend success page
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ duoStatus: 'success' }, "https://curasure-frontend-production.onrender.com");
              window.close();
            } else {
              window.location.href = 'https://curasure-frontend-production.onrender.com/curasure/register-success';
            }
          </script>
          <p>Duo verification successful. You may close this window.</p>
        </body>
      </html>
    `);

  } catch (error) {
    console.error('Duo callback error:', error);
    res.status(500).json({ message: 'Duo verification failed' });
  }
});


  
  
  
  

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
  
      const client = new Client({
        clientId: process.env.DUO_CLIENT_ID,
        clientSecret: process.env.DUO_CLIENT_SECRET,
        apiHost: process.env.DUO_API_HOSTNAME,
        redirectUrl: "http://localhost:5002/api/auth/duo/login-callback"
      });
  
      req.session.pendingLogin = { email, role };
      req.session.duoState = client.generateState();
      console.log("➡️ Login session pendingLogin:", req.session.pendingLogin);
      console.log("➡️ Login session duoState:", req.session.duoState);

      const duoAuthUrl = client.createAuthUrl(email, req.session.duoState);
  
      res.json({ duoAuthUrl });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error', error });
    }
  });
  router.get('/duo/login-callback', async (req, res) => {
    

    const code = req.query.duo_code;
    const state = req.query.state;

    console.log("↩️ Callback received");
    console.log("Duo Code:", code);
    console.log("State:", state);
    console.log("Session.pendingLogin:", req.session.pendingLogin);
    console.log("Session.duoState:", req.session.duoState);
    const pending = req.session.pendingLogin;
  
    if (!code || !state || state !== req.session.duoState || !pending) {
      return res.status(400).send("Duo login failed.");
    }
  
    try {
      const client = new Client({
        clientId: process.env.DUO_CLIENT_ID,
        clientSecret: process.env.DUO_CLIENT_SECRET,
        apiHost: process.env.DUO_API_HOSTNAME,
        redirectUrl: "http://localhost:5002/api/auth/duo/login-callback"
      });
  
      await client.exchangeAuthorizationCodeFor2FAResult(code, pending.email);
  
      const user = await User.findOne({ email: pending.email, role: pending.role });
      const token = jwt.sign(
        { _id: user._id, email: user.email, role: user.role, theme: user.theme },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
  
      req.session.pendingLogin = null;
      req.session.duoState = null;
  
      res.send(`
        <script>
          if (window.opener) {
            window.opener.postMessage({
              duoLoginSuccess: true,
              token: ${JSON.stringify(token)},
              user: ${JSON.stringify({
                id: user._id,
                email: user.email,
                role: user.role,
                name: user.name,
                theme: user.theme,
              })}
            }, "http://localhost:5173");
            window.close();
          } else {
            document.body.innerHTML = '<h2>Login successful. You may close this tab.</h2>';
          }
        </script>
      `);
    } catch (err) {
      console.error("Duo login callback error:", err);
      res.status(500).send("Duo verification failed");
    }
  });
  


// Home Route (Before Login & After Logout)
router.get('/', (req, res) => {
  res.send('<h1>Welcome to the Patient & Insurance Management System</h1><p>Please login to access your account.</p>');
});

// Role-based Home Pages
router.get('/dashboard', authMiddleware, (req, res) => {
  const role = req.user.role;
  if (role === 'patient') {
    res.send('<h1>Welcome, Patient</h1><p>Here is your personal dashboard.</p>');
  } else if (role === 'doctor') {
    res.send('<h1>Welcome, Doctor</h1><p>Here is your doctor dashboard.</p>');
  } else if (role === 'insurance') {
    res.send('<h1>Welcome, Insurance Provider</h1><p>Here is your insurance provider dashboard.</p>');
  } else {
    res.status(400).json({ message: 'Invalid role' });
  }
});
// Need to update the DB for this section
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
        {
          new: true,           // Return the modified document
          upsert: true,        // Create the document if it doesn't exist
          setDefaultsOnInsert: true  // Apply default values if creating
        }
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

// Search and Filter API
router.get('/doctors', async (req, res) => {
    try {
      const { name, specialization, covidCare } = req.query;
      let query = {};
      if (name) query.name = { $regex: name, $options: 'i' };
      if (specialization) query.specialization = { $regex: specialization, $options: 'i' };
      if (covidCare) query.covidCare = covidCare === 'true';
      
      const doctors = await Doctor.find(query);
      res.json(doctors);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  });

module.exports = router;
