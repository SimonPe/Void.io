const socket = io();

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const scoreboard = document.getElementById('scoreboard');
const nicknameForm = document.getElementById('nicknameForm');
const nicknameInput = document.getElementById('nickname');
const startButton = document.getElementById('startButton');

let players = {};
let objects = [];
let nickname = '';
let gameStarted = false;
let playerId = '';

let targetX = 0;
let targetY = 0;

startButton.addEventListener('click', () => {
  nickname = nicknameInput.value.trim();
  if (nickname) {
    socket.emit('setNickname', nickname);
    nicknameForm.style.display = 'none';
    canvas.style.display = 'block';
    gameStarted = true;
  }
});

socket.on('init', (data) => {
  players = data.players;
  objects = data.objects;
  playerId = socket.id;
  draw();
  updateScoreboard();
});

socket.on('update', (data) => {
  if (!gameStarted) return;

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

canvas.addEventListener('mousemove', (event) => {
  const rect = canvas.getBoundingClientRect();
  targetX = event.clientX - rect.left - canvas.width / 2;
  targetY = event.clientY - rect.top - canvas.height / 2;
});

socket.on('updateBlueBalls', (blueBalls) => {
  objects = objects.filter(obj => obj.type !== 'blueBall').concat(blueBalls);
});

function draw() {
  if (!gameStarted) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const player = players[playerId];
  const offsetX = canvas.width / 2 - player.x;
  const offsetY = canvas.height / 2 - player.y;
  
  ctx.save();
  ctx.translate(offsetX, offsetY);

  objects.forEach((object) => {
    ctx.beginPath();
    ctx.arc(object.x, object.y, object.size, 0, Math.PI * 2);
    ctx.fillStyle = object.type === 'blueBall' ? 'blue' : 'green';
    ctx.fill();
    ctx.closePath();
  });

  for (let id in players) {
    const player = players[id];
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
    ctx.fillStyle = 'black';
    ctx.fill();
    ctx.closePath();
  }

  ctx.restore();
}

function updateScoreboard() {
  const sortedPlayers = Object.values(players).sort((a, b) => b.score - a.score);

  let scoreboardHTML = '<h2>Scoreboard</h2>';
  sortedPlayers.forEach((player, index) => {
    scoreboardHTML += `<p>${index + 1}. ${player.nickname || 'Player'}: ${player.score}</p>`;
  });

  scoreboard.innerHTML = scoreboardHTML;
}

function updatePosition() {
  if (!gameStarted) return;

  const player = players[playerId];
  const baseSpeed = 2; 
  const speedMultiplier = 0.05; 
  const speed = baseSpeed + (player.size * speedMultiplier);

  const dx = targetX;
  const dy = targetY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance > speed) {
    player.x += (dx / distance) * speed;
    player.y += (dy / distance) * speed;
  } else {
    player.x += dx;
    player.y += dy;
  }

  socket.emit('move', { x: player.x, y: player.y });
  draw();
}

function draw() {
  if (!gameStarted) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const player = players[playerId];
  const offsetX = canvas.width / 2 - player.x;
  const offsetY = canvas.height / 2 - player.y;
  
  ctx.save();
  ctx.translate(offsetX, offsetY);

  objects.forEach((object) => {
    ctx.beginPath();
    ctx.arc(object.x, object.y, object.size, 0, Math.PI * 2);
    ctx.fillStyle = object.type === 'blueBall' ? 'blue' : 'green';
    ctx.fill();
    ctx.closePath();
  });

  for (let id in players) {
    const player = players[id];
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
    ctx.fillStyle = 'black';
    ctx.fill();
    ctx.closePath();
  }

  ctx.restore();
}

setInterval(updatePosition, 20);