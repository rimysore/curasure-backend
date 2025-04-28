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
    origin: ['https://curasure-frontend.vercel.app'],  // 🟢 Exact frontend origin
    methods: ['GET', 'POST'],
    credentials: true  // 🟢 Allow cookies/session
  }
});

// ✅ Trust Render's proxy for HTTPS
app.set('trust proxy', 1);  // Add this line

// ✅ Optional HTTPS redirect middleware (force HTTPS)
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});

// ✅ CORS setup
const allowedOrigins = [
  'https://curasure-frontend.vercel.app',
  'http://localhost:5173' // Optional: for local dev
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed for this origin: ' + origin));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));
app.options('*', cors());

// ✅ Body parsers
app.use(express.json());
app.use(bodyParser.json());

// ✅ Session setup (secure cookies)
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions',
    ttl: 14 * 24 * 60 * 60,
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Secure cookies in production (enabled by trust proxy)
    httpOnly: true,
    sameSite: 'None',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// ✅ Passport
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
      io.to(receiverSocket).emit('receive-message', msg);  // ✅ Receiver gets the message
      msg.delivered = true;                                // ✅ Mark as delivered in DB
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

      // 🟢 Emit back to sender to update delivery status on their UI
      const senderSocket = onlineUsers[senderId];
      if (senderSocket) {
        io.to(senderSocket).emit('message-delivered', { senderId, receiverId });
      }
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

// ✅ Health check
app.get('/', (req, res) => res.send('Chat server is running'));

// ✅ Server start
const PORT = process.env.PORT || 5002;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
