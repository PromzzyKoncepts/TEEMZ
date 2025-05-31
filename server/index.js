const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

let onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('register', (userInfo) => {
    onlineUsers.set(socket.id, userInfo);
    io.emit('onlineUsers', Array.from(onlineUsers.values()));
  });

  socket.on('message', (msg) => {
  const sender = onlineUsers.get(socket.id);
  io.emit('message', { 
    sender, 
    text: msg,
    timestamp: new Date() // Add timestamp
  });
});

  socket.on('typing', (isTyping) => {
    const sender = onlineUsers.get(socket.id);
    socket.broadcast.emit('typing', { sender, isTyping });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    onlineUsers.delete(socket.id);
    io.emit('onlineUsers', Array.from(onlineUsers.values()));
  });
});

server.listen(4000, () => console.log('Server running on http://localhost:4000'));