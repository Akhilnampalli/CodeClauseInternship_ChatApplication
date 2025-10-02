const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// simple in-memory user store: { socketId: {username, room} }
const users = {};

function getUsersInRoom(room) {
  return Object.values(users).filter(u => u.room === room).map(u => u.username);
}

io.on('connection', socket => {
  console.log('New socket connected:', socket.id);

  socket.on('joinRoom', ({ username, room }) => {
    username = String(username || 'Anonymous').trim();
    room = String(room || 'General').trim();

    users[socket.id] = { username, room };
    socket.join(room);

    // welcome to current user
    socket.emit('message', {
      author: 'System',
      text: `Welcome ${username}! You joined room: ${room}`,
      time: new Date().toISOString()
    });

    // notify others
    socket.to(room).emit('message', {
      author: 'System',
      text: `${username} has joined the room.`,
      time: new Date().toISOString()
    });

    // send updated user list
    io.to(room).emit('roomUsers', {
      room,
      users: getUsersInRoom(room)
    });
  });

  socket.on('chatMessage', msg => {
    const u = users[socket.id];
    if (!u) return;
    const message = {
      author: u.username,
      text: String(msg),
      time: new Date().toISOString()
    };
    io.to(u.room).emit('message', message);
  });

  socket.on('leaveRoom', () => {
    const u = users[socket.id];
    if (u) {
      socket.leave(u.room);
      socket.to(u.room).emit('message', {
        author: 'System',
        text: `${u.username} has left the room.`,
        time: new Date().toISOString()
      });
      delete users[socket.id];
      io.to(u.room).emit('roomUsers', {
        room: u.room,
        users: getUsersInRoom(u.room)
      });
    }
  });

  socket.on('disconnect', () => {
    const u = users[socket.id];
    if (u) {
      socket.to(u.room).emit('message', {
        author: 'System',
        text: `${u.username} disconnected.`,
        time: new Date().toISOString()
      });
      delete users[socket.id];
      io.to(u.room).emit('roomUsers', {
        room: u.room,
        users: getUsersInRoom(u.room)
      });
    }
    console.log('Socket disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Chat server running on port', PORT));