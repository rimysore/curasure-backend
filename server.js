const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const passport = require('passport');
const session = require('express-session'); 
const authRoutes = require('./routes/auth');  // Import the router from /routes/auth
require('./config/passportConfig');  // Import the passport configuration

dotenv.config();

const app = express();

//cors setup
const cors = require('cors');
app.use(cors({ origin: 'http://localhost:5173' }));  // Allow frontend to access backend


// Session middleware before passport
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',  // Set a secret key for signing the session ID cookie
    resave: false,  // Don't resave session if it hasn't changed
    saveUninitialized: false,  // Don't create a session until something is stored
  }));

// Middleware
app.use(express.json());
app.use(passport.initialize()); 
app.use(passport.session());  // Initialize Passport

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
