const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

let players = {};
let objects = []; 

function generateObjects() {
  for (let i = 0; i < 10; i++) {
    let object = {
      x: Math.random() * 800,
      y: Math.random() * 600,
      size: Math.random() * 20 + 10, 
      type: 'blueBall' 
    };
    objects.push(object);
  }
}

generateObjects();

io.on('connection', (socket) => {
  console.log('A user connected');

  players[socket.id] = {
    x: Math.random() * 800,
    y: Math.random() * 600,
    size: 50,
    score: 0
  };

  socket.emit('init', { players, objects });

  socket.broadcast.emit('playerJoin', socket.id);

  socket.on('move', (data) => {
    players[socket.id].x += data.x;
    players[socket.id].y += data.y;

    objects.forEach((object, index) => {
      const dx = players[socket.id].x - object.x;
      const dy = players[socket.id].y - object.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < players[socket.id].size + object.size) {
        players[socket.id].size += object.type === 'blueBall' ? 5 : 2; 
        if (object.type === 'blueBall') {
          players[socket.id].score++;
        }
        objects.splice(index, 1);
      }
    });

    for (let playerId in players) {
      if (playerId !== socket.id) {
        const otherPlayer = players[playerId];
        const dx = players[socket.id].x - otherPlayer.x;
        const dy = players[socket.id].y - otherPlayer.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (players[socket.id].size > otherPlayer.size && distance < players[socket.id].size - otherPlayer.size) {
          players[socket.id].size += Math.min(otherPlayer.size, 1); 
          otherPlayer.x = Math.random() * 800;
          otherPlayer.y = Math.random() * 600;
          otherPlayer.size = 50; 
          io.to(playerId).emit('death');
        }
      }
    }

    io.emit('update', { players, objects });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
    delete players[socket.id];
    io.emit('playerLeave', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
