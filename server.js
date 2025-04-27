const express = require('express');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const session = require('express-session');
const cors = require('cors');

// Routers
const authRoutes = require('./routes/auth');
const doctorRoutes = require('./routes/docRoutes');
const covidRoutes = require('./routes/covidRoutes');
const patientRoutes = require('./routes/patientRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const hospitalBedRoutes = require('./routes/hospitalBedRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const insuranceProviderRoutes = require('./routes/InsuranceProviderRoutes');
const userRoutes = require('./routes/userRoutes');
const insurancePackageRoutes = require('./routes/insurancePackageRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const covidArticleRoutes = require('./routes/covidArticleRoutes');
const statisticsRoutes = require('./routes/statisticsRoutes');
const chatRoutes = require('./routes/chatRoutes');

// Models
const Message = require('./models/Message');
const Doctor = require('./models/Doctor');

// Config
require('./config/passportConfig');
dotenv.config();

// App setup
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*', // You can limit this in prod
    methods: ['GET', 'POST'],
  }
});

// ✅ CORS setup
const allowedOrigins = [
  'https://curasure-frontend.vercel.app',
  'http://localhost:5173' // Optional: for local dev
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed for this origin: ' + origin));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

// Handle preflight OPTIONS requests for all routes
app.options('*', cors());
// Body parsers
app.use(express.json());
app.use(bodyParser.json());

// Session
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI, // MongoDB URI for session storage
    collectionName: 'sessions',       // Name of the collection to store sessions
    ttl: 14 * 24 * 60 * 60,           // Session expiration (2 weeks)
  }),
  cookie: {
    secure: false, // Secure cookies in production
    httpOnly: true,                                // Prevent JavaScript access to cookies
    sameSite: 'None',                              // Allow cross-origin cookies
    maxAge: 24 * 60 * 60 * 1000,
  }
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

// ✅ MongoDB connect
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('Database connection error:', err));

// ✅ Socket.IO logic
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

  socket.on("typing", ({ to }) => {
    const toSocket = onlineUsers[to];
    if (toSocket) io.to(toSocket).emit("typing");
  });

  socket.on("send-group-message", async ({ senderId, message }) => {
    const doctor = await Doctor.findById(senderId).select("name");

    const newMsg = new Message({
      senderId,
      message,
      type: "text",
      isGroup: true,
      group: "doctors"
    });

    await newMsg.save();

    io.emit("receive-group-message", {
      senderId,
      senderName: doctor?.name || "Unknown",
      message,
      timestamp: newMsg.timestamp
    });
  });

  socket.on("message-delivered", async ({ senderId, receiverId }) => {
    try {
      await Message.updateMany(
        { senderId, receiverId, delivered: false },
        { $set: { delivered: true } }
      );
    } catch (err) {
      console.error("❌ Error updating delivery:", err);
    }
  });

  socket.on("disconnect", () => {
    const userId = Object.keys(onlineUsers).find(key => onlineUsers[key] === socket.id);
    if (userId) {
      delete onlineUsers[userId];
      io.emit("user-online-status", { userId, online: false });
    }
  });
});

// ✅ Routes
app.use('/api/auth', authRoutes);
app.use('/api', doctorRoutes);
app.use('/api', covidRoutes);
app.use('/api', patientRoutes);
app.use('/api', feedbackRoutes);
app.use('/api', hospitalBedRoutes);
app.use('/api', hospitalRoutes);
app.use('/api', appointmentRoutes);
app.use('/api/insurance-provider', insuranceProviderRoutes);
app.use('/api/user', userRoutes);
app.use('/api', insurancePackageRoutes);
app.use('/api', subscriptionRoutes);
app.use('/api/covid-articles', covidArticleRoutes);
app.use('/api', statisticsRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/', (req, res) => res.send('Chat server is running'));

// Server start
const PORT = process.env.PORT || 5002;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
