const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const passport = require('passport');
const { OAuth2Client } = require('google-auth-library');

const mongoose = require('mongoose');
const User = require('../models/UserData');

require('dotenv').config();

const router = express.Router();
const USERS_FILE = path.join(__dirname, '../users.json');
const axios = require('axios');



// Duo Credentials
const duoIkey = process.env.DUO_INTEGRATION_KEY;
const duoSkey = process.env.DUO_SECRET_KEY;
const duoApiHost = process.env.DUO_API_HOSTNAME;

// Configure Nodemailer to use Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',  // Use Gmail service
  auth: {
    user: process.env.MAIL_USER,  // Your Gmail address
    pass: process.env.MAIL_PASS   // Your Google app password
  }
});

// Helper Function to generate Duo TX (transaction)
const generateDuoTx = (username) => {
  const requestPayload = {
    'username': username,
    'factor': 'Push',  // Use Push, Passcode, or SMS for Duo authentication
    'device': 'auto'  // Auto-device selection or specify a specific device
  };

  return axios.post(`https://${duoApiHost}/admin/v1/auth/prompt`, requestPayload, {
    headers: {
      'Authorization': `Basic ${Buffer.from(duoIkey + ':' + duoSkey).toString('base64')}`,
    },
  })
  .then(response => response.data.tx)
  .catch(error => {
    console.error('Duo API Error:', error);
    throw new Error('Failed to generate Duo transaction');
  });
};
// Return reCAPTCHA site key to frontend
router.get('/recaptcha-key', (req, res) => {
  const siteKey = process.env.RECAPTCHA_SITE_KEY;
  if (!siteKey) {
    return res.status(500).json({ message: 'reCAPTCHA site key not configured' });
  }
  res.json({ siteKey });
});

// Duo Authentication Route
router.post('/duo-auth', (req, res) => {
  const username = req.body.email;  // Get the username (email) from the authenticated user

  // Step 1: Generate Duo Authentication Request
  generateDuoTx(username)
    .then((tx) => {
      if (tx) {
        const duoUrl = `https://${duoApiHost}/frame/web/v1/auth?tx=${tx}`;
        // Return the Duo URL to the frontend
        res.json({ duo_url: duoUrl });
      } else {
        res.status(500).json({ message: 'Failed to generate Duo transaction' });
      }
    })
    .catch((error) => {
      console.error('Error during Duo authentication:', error);
      res.status(500).json({ message: 'Error initiating Duo authentication' });
    });
});

// Duo Callback Route (after Duo Push response)
router.post('/duo-callback', (req, res) => {
  const { tx, sig_response } = req.body;  // Duo response from frontend

  // Step 3: Verify the Duo response
  verifyDuoResponse(tx, sig_response)
    .then((authResponse) => {
      if (authResponse.stat === 'OK') {
        // Duo authentication successful
        const token = jwt.sign({ email: req.user.email, role: req.user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ message: 'Duo authentication successful', token });
      } else {
        // Duo authentication failed
        res.status(400).json({ message: 'Duo authentication failed' });
      }
    })
    .catch((error) => {
      res.status(500).json({ message: 'Duo authentication error', error });
    });
});

// Helper Function to verify Duo response
const verifyDuoResponse = (tx, sig_response) => {
  const requestPayload = {
    'tx': tx,
    'sig_response': sig_response
  };

  return axios.post(`https://${duoApiHost}/admin/v1/auth/verify`, requestPayload, {
    headers: {
      'Authorization': `Basic ${Buffer.from(duoIkey + ':' + duoSkey).toString('base64')}`,
    },
  })
  .then(response => response.data)
  .catch(error => {
    console.error('Duo Verification Error:', error);
    throw error;
  });
};

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
  const { email, password, role, theme, name } = req.body;  // Added name to destructure
  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }
  if (!email || !password || !name) {  // Ensure name is required
    return res.status(400).json({ message: 'Email, password, and name are required' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists, please login' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword, role, theme: theme || 'default', name });
    await newUser.save();

    // Send email notification after registration
    transporter.sendMail({
      from: `Support <${process.env.MAIL_USER}>`,
      to: email,
      subject: 'Registration Successful',
      html: `<p>Welcome, ${name}!</p><p>Your account has been successfully created.</p>`
    });

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message || 'Unknown error occurred'
    });
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

    const token = jwt.sign({_id:user._id, email: user.email, role: user.role, theme: user.theme }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // ✅ Updated response to send user data as well
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,         // ✅ sending MongoDB _id
        email: user.email,
        role: user.role,
        theme: user.theme,
        name: user.name || "", // ✅ if you have name field
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
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

    const resetUrl = `${process.env.BASE_URL}/api/auth/reset-password?token=${resetToken}`;
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
