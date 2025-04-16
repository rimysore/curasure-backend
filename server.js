const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
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
const Message = require('./models/Message');


// 👉 NEW Routes we made just now
const insurancePackageRoutes = require('./routes/insurancePackageRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const covidArticleRoutes = require('./routes/covidArticleRoutes');
const statisticsRoutes = require('./routes/statisticsRoutes');
const chatRoutes = require('./routes/chatRoutes');

// Import Passport config
require('./config/passportConfig');

// Initialize app
dotenv.config();
const app = express();

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*', // match your frontend port
    methods: ['GET', 'POST']
  }
});

// Connected users: userId -> socket.id
let onlineUsers = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("register", (userId) => {
    onlineUsers[userId] = socket.id;
    io.emit("user-online-status", { userId, online: true });
  });

  socket.on('send-message', async ({ senderId, receiverId, message }) => {
    const msg = new Message({ senderId, receiverId, message });
    await msg.save();

    const receiverSocket = onlineUsers[receiverId];
    if (receiverSocket) {
      io.to(receiverSocket).emit('receive-message', msg);
      msg.delivered = true;
      await msg.save();
    }
  });

  socket.on('typing', ({ to }) => {
    const toSocket = onlineUsers[to];
    if (toSocket) io.to(toSocket).emit('typing');
  });

  socket.on("disconnect", () => {
    const userId = Object.keys(onlineUsers).find((key) => onlineUsers[key] === socket.id);
    if (userId) {
      delete onlineUsers[userId];
      io.emit("user-online-status", { userId, online: false });
    }
  });

  socket.on("send-group-message", async ({ senderId, message }) => {
    const newMsg = new Message({
      senderId,
      message,
      group: "doctors", // tag for group chat
      timestamp: Date.now(),
    });
    await newMsg.save();
  
    io.emit("receive-group-message", {
      senderId,
      message,
      timestamp: newMsg.timestamp,
    });
  });
});



// CORS setup
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));







 

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected');
}).catch((err) => {
  console.error('Database connection error:', err);
});

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
app.use('/api', feedbackRoutes);                        // Feedback Routes
app.use('/api', hospitalBedRoutes);                     // Hospital Bed Routes
app.use('/api', hospitalRoutes);                        // Hospital Routes
app.use('/api', appointmentRoutes);                     // Appointment Routes
app.use('/api/insurance-provider', insuranceProviderRoutes); // Insurance Provider Routes

// 👉 NEW Mappings
app.use('/api', insurancePackageRoutes);                // Insurance Package Routes
app.use('/api', subscriptionRoutes);                    // Subscription Routes
app.use('/api/covid-articles', covidArticleRoutes);                   // COVID-19 Article Routes
app.use('/api', statisticsRoutes);        
app.use("/api/chat", chatRoutes);              // Statistics Routes

// Basic health route
app.get('/', (req, res) => res.send('Chat server is running'));

// Start the server
const PORT = process.env.PORT || 5002;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
