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

const MAP_WIDTH = 2000;  
const MAP_HEIGHT = 2000; 
const BORDER_THICKNESS = 10;  
const MINIMAP_SCALE = 0.1;  
const MINIMAP_PADDING = 20; 

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
  objects = objects.filter(obj => obj.type !== 'blueBall').concat(blueBalls.filter(obj => isInBounds(obj)));
});

function isInBounds(obj) {
  return obj.x >= 0 && obj.x <= MAP_WIDTH && obj.y >= 0 && obj.y <= MAP_HEIGHT;
}

function draw() {
  if (!gameStarted) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const player = players[playerId];
  const offsetX = canvas.width / 2 - player.x;
  const offsetY = canvas.height / 2 - player.y;

  ctx.save();
  ctx.translate(offsetX, offsetY);

  ctx.strokeStyle = 'red';
  ctx.lineWidth = BORDER_THICKNESS;
  ctx.strokeRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

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
    ctx.fillStyle = id === playerId ? 'black' : 'red';
    ctx.fill();
    ctx.closePath();
  }

  ctx.restore();

  drawMinimap();
}

function drawMinimap() {
  const minimapWidth = MAP_WIDTH * MINIMAP_SCALE;
  const minimapHeight = MAP_HEIGHT * MINIMAP_SCALE;
  const minimapX = canvas.width - minimapWidth - MINIMAP_PADDING;
  const minimapY = canvas.height - minimapHeight - MINIMAP_PADDING;

  ctx.save();
  ctx.translate(minimapX, minimapY);
  ctx.scale(MINIMAP_SCALE, MINIMAP_SCALE);

  ctx.strokeStyle = 'red';
  ctx.lineWidth = BORDER_THICKNESS / MINIMAP_SCALE;
  ctx.strokeRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

  objects.forEach((object) => {
    if (object.type === 'blueBall') {
      ctx.beginPath();
      ctx.arc(object.x, object.y, object.size * 0.5, 0, Math.PI * 2); 
      ctx.fillStyle = 'blue';
      ctx.fill();
      ctx.closePath();
    }
  });

  for (let id in players) {
    const player = players[id];
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = id === playerId ? 'black' : 'red'; 
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

  player.x = Math.max(player.size + BORDER_THICKNESS, Math.min(player.x, MAP_WIDTH - player.size - BORDER_THICKNESS));
  player.y = Math.max(player.size + BORDER_THICKNESS, Math.min(player.y, MAP_HEIGHT - player.size - BORDER_THICKNESS));

  socket.emit('move', { x: player.x, y: player.y });
  draw();
}

setInterval(updatePosition, 20);
