const socketIO = require('socket.io');
const Message = require('../models/Message');

let onlineUsers = {}; // { userId: socketId }

function setupSocket(server) {
  const io = socketIO(server, {
    cors: { origin: '*' }
  });

  io.on('connection', (socket) => {
    console.log('🟢 User connected:', socket.id);

    // Join a user to their own room
    socket.on('join', (userId) => {
      onlineUsers[userId] = socket.id;
      console.log(`User ${userId} is online`);
    });

    // Typing indicator
    socket.on('typing', ({ to }) => {
      if (onlineUsers[to]) {
        io.to(onlineUsers[to]).emit('typing');
      }
    });

    // Sending a message
    socket.on('private_message', async (data) => {
      const { from, to, content, fromModel, toModel } = data;
      const msg = new Message({
        senderId: from,
        receiverId: to,
        content,
        senderModel: fromModel,
        receiverModel: toModel
      });
      await msg.save();

      const toSocket = onlineUsers[to];
      if (toSocket) {
        io.to(toSocket).emit('new_message', msg);
        msg.isDelivered = true;
        await msg.save();
      }
    });

    socket.on('disconnect', () => {
      const userId = Object.keys(onlineUsers).find(key => onlineUsers[key] === socket.id);
      delete onlineUsers[userId];
      console.log('🔴 User disconnected:', socket.id);
    });
  });
}

module.exports = setupSocket;
