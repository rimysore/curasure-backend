const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const passport = require('passport');
const session = require('express-session');
const cors = require('cors');

// Import routers
const authRoutes = require('./routes/auth');
const doctorRoutes = require('./routes/DoctorRoutes');
const covidRoutes = require('./routes/covidRoutes');
const patientRoutes = require('./routes/patientRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const hospitalBedRoutes = require('./routes/hospitalBedRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const insuranceProviderRoutes = require('./routes/insuranceProviderRoutes');

// 👉 NEW Routes we made just now
const insurancePackageRoutes = require('./routes/insurancePackageRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const covidArticleRoutes = require('./routes/covidArticleRoutes');
const statisticsRoutes = require('./routes/statisticsRoutes');

// Import Passport config
require('./config/passportConfig');

// Initialize app
dotenv.config();
const app = express();

// CORS setup
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));

// Body Parser
app.use(express.json());
app.use(bodyParser.json());

// Session setup (important before passport)
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
}));

// Passport setup
app.use(passport.initialize());
app.use(passport.session());

// Mount routes
app.use('/api/auth', authRoutes);                      // Auth Routes
app.use('/api', doctorRoutes);                          // Doctor Routes
app.use('/api', covidRoutes);                           // Covid Routes
app.use('/api', patientRoutes);                         // Patient Routes
console.log("Mounting feedback routes...");
app.use('/api', feedbackRoutes);                        // Feedback Routes
app.use('/api', hospitalBedRoutes);                     // Hospital Bed Routes
app.use('/api', hospitalRoutes);                        // Hospital Routes
app.use('/api', appointmentRoutes);                     // Appointment Routes
app.use('/api/insurance-provider', insuranceProviderRoutes); // Insurance Provider Routes

// 👉 NEW Mappings
app.use('/api', insurancePackageRoutes);                // Insurance Package Routes
app.use('/api', subscriptionRoutes);                    // Subscription Routes
app.use('/api/covid-articles', covidArticleRoutes);                   // COVID-19 Article Routes
app.use('/api', statisticsRoutes);                      // Statistics Routes

// MongoDB Connection
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
