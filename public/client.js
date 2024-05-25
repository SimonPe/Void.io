const socket = io();

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const scoreboard = document.getElementById('scoreboard');

let players = {};
let objects = [];

socket.on('init', (data) => {
  players = data.players;
  objects = data.objects;
});

socket.on('update', (data) => {
  players = data.players;
  objects = data.objects;
  draw();
  updateScoreboard(); 
});

socket.on('death', () => {
  const deathScreen = document.createElement('div');
  deathScreen.classList.add('death-screen');
  deathScreen.innerText = 'You have been eaten!';
  document.body.appendChild(deathScreen);
  setTimeout(() => {
    deathScreen.remove();
  }, 3000);
});

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  objects.forEach((object) => {
    ctx.beginPath();
    ctx.arc(object.x, object.y, object.size, 0, Math.PI * 2);
    ctx.fillStyle = object.type === 'blueBall' ? 'blue' : 'green'; 
    ctx.fill();
    ctx.closePath();
  });
  for (let playerId in players) {
    const player = players[playerId];
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
    ctx.fillStyle = 'black';
    ctx.fill();
    ctx.closePath();
  }
}

function updateScoreboard() {
  const sortedPlayers = Object.values(players).sort((a, b) => b.score - a.score);

  let scoreboardHTML = '<h2>Scoreboard</h2>';
  sortedPlayers.forEach((player, index) => {
    scoreboardHTML += `<p>${index + 1}. Player ${index + 1}: ${player.score}</p>`;
  });

  scoreboard.innerHTML = scoreboardHTML;
}

document.addEventListener('keydown', (event) => {
  let move = { x: 0, y: 0 };
  switch (event.key) {
    case 'ArrowUp':
      move.y = -5;
      break;
    case 'ArrowDown':
      move.y= 5;
      break;
      case 'ArrowLeft':
      move.x = -5;
      break;
      case 'ArrowRight':
      move.x = 5;
      break;
      }
      socket.emit('move', move);
      });
