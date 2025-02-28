const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const passport = require('passport');
const authRoutes = require('./routes/auth');  // Import the router from /routes/auth
require('./config/passportConfig');  // Import the passport configuration

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(passport.initialize());  // Initialize Passport

// Routes
app.use('/api/auth', authRoutes);  // Use the authRoutes for '/api/auth'

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected');
}).catch((err) => {
  console.error('Database connection error:', err);
});

// Start the server
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
