// Archivo separado para la lógica del juego Laberinto 2 Jugadores

// HASTA ACA TODO FUNCIONA PERFECTO 

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let cols, rows;
let cellSize;
let grid = [];
let stack = [];

let player1 = {x: 0, y: 0, color: 'red', name: 'Rojo'};
let player2 = {x: 0, y: 0, color: 'blue', name: 'Azul'};

let keysPressed = {};

let goal1, goal2; // metas para cada jugador

let iaPlayers = [];
let iaInterval = null;
let iaTimeout = null;

// Historial de movimientos de los jugadores
let player1Path = [];
let player2Path = [];
let iaDelay = 3; // cuántos pasos detrás va la IA
let iaSpeed = 350; // ms, más lento que el jugador

// Clase para cada celda del laberinto
class Cell {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.walls = [true, true, true, true]; 
    this.visited = false;
  }

  draw() {
    const x = this.x * cellSize;
    const y = this.y * cellSize;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    if(this.walls[0]) drawLine(x, y, x + cellSize, y);          // Top
    if(this.walls[1]) drawLine(x + cellSize, y, x + cellSize, y + cellSize); // Right
    if(this.walls[2]) drawLine(x + cellSize, y + cellSize, x, y + cellSize); // Bottom
    if(this.walls[3]) drawLine(x, y + cellSize, x, y);          // Left
  }
}

function drawLine(x1, y1, x2, y2){
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

// Generar laberinto con DFS
function generateMaze() {
  grid = [];
  for(let y=0; y<rows; y++){
    for(let x=0; x<cols; x++){
      grid.push(new Cell(x,y));
    }
  }

  let current = grid[0];
  current.visited = true;
  stack = [];

  while(true){
    let next = checkNeighbors(current);
    if(next){
      next.visited = true;
      stack.push(current);
      removeWalls(current, next);
      current = next;
    } else if(stack.length > 0){
      current = stack.pop();
    } else {
      break;
    }
  }
}

function checkNeighbors(cell) {
  let neighbors = [];

  let {x,y} = cell;

  let top    = getCell(x, y -1);
  let right  = getCell(x +1, y);
  let bottom = getCell(x, y +1);
  let left   = getCell(x -1, y);

  if(top && !top.visited) neighbors.push(top);
  if(right && !right.visited) neighbors.push(right);
  if(bottom && !bottom.visited) neighbors.push(bottom);
  if(left && !left.visited) neighbors.push(left);

  if(neighbors.length > 0){
    let r = Math.floor(Math.random() * neighbors.length);
    return neighbors[r];
  }
  return undefined;
}

function getCell(x,y){
  if(x < 0 || y < 0 || x >= cols || y >= rows) return undefined;
  return grid[x + y * cols];
}

function removeWalls(a,b){
  let x = a.x - b.x;
  let y = a.y - b.y;

  if(x === 1){
    a.walls[3] = false;
    b.walls[1] = false;
  } else if(x === -1){
    a.walls[1] = false;
    b.walls[3] = false;
  }

  if(y === 1){
    a.walls[0] = false;
    b.walls[2] = false;
  } else if(y === -1){
    a.walls[2] = false;
    b.walls[0] = false;
  }
}

function drawMaze(){
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for(let cell of grid){
    cell.draw();
  }
  drawGoals();
}

function drawGoals() {
  ctx.save();
  ctx.shadowColor = '#00ff7f';
  ctx.shadowBlur = 16;
  ctx.fillStyle = 'rgba(0,255,127,0.85)';
  ctx.fillRect(goal1.x * cellSize + 4, goal1.y * cellSize + 4, cellSize - 8, cellSize - 8);
  ctx.fillRect(goal2.x * cellSize + 4, goal2.y * cellSize + 4, cellSize - 8, cellSize - 8);
  ctx.restore();
}

function drawPlayer(player){
  ctx.save();
  ctx.shadowColor = player.color === 'white' ? '#fff' : player.color;
  ctx.shadowBlur = player.color === 'white' ? 10 : 16;
  ctx.fillStyle = player.color;
  ctx.beginPath();
  let px = player.x * cellSize + cellSize/2;
  let py = player.y * cellSize + cellSize/2;
  let radius = cellSize/3;
  ctx.arc(px, py, radius, 0, Math.PI*2);
  ctx.fill();
  ctx.shadowBlur = 0;
  // Borde para IA
  if(player.color === 'white') {
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffb347';
    ctx.stroke();
  }
  // Nombre
  if(player.name) {
    ctx.fillStyle = '#fff';
    ctx.font = `${Math.max(12, cellSize/3)}px Montserrat, Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(player.name, px, py - radius - 4);
  }
  ctx.restore();
}

function canMovePlayer(player, x, y){
  if(x < 0 || y < 0 || x >= cols || y >= rows) return false;

  let cell = getCell(player.x, player.y);
  if(!cell) return false;

  let dx = x - player.x;
  let dy = y - player.y;

  if(dx === 1 && cell.walls[1]) return false;
  if(dx === -1 && cell.walls[3]) return false;
  if(dy === 1 && cell.walls[2]) return false;
  if(dy === -1 && cell.walls[0]) return false;

  return true;
}

function movePlayer(player, direction){
  let x = player.x;
  let y = player.y;
  if(direction === 'up') y--;
  else if(direction === 'down') y++;
  else if(direction === 'left') x--;
  else if(direction === 'right') x++;

  if(canMovePlayer(player, x, y)){
    player.x = x;
    player.y = y;
    if(player.color === 'red') player1Path.push({x, y});
    if(player.color === 'blue') player2Path.push({x, y});
    drawMaze();
    drawPlayer(player1);
    drawPlayer(player2);
    drawIAPlayers();
    let existeIA = iaPlayers.some(ia => ia.target === player);
    if (!existeIA) {
      setTimeout(() => {
        spawnIAPlayers();
      }, 1200);
    }
    // Animación de meta en vez de alert
    if(player.x === goal1.x && player.y === goal1.y && player.color === 'red'){
      showFireworksAndNextLevel(player);
      return;
    }
    if(player.x === goal2.x && player.y === goal2.y && player.color === 'blue'){
      showFireworksAndNextLevel(player);
      return;
    }
  }
}

function spawnIAPlayers() {
  // Solo agregar IA si no existe ya una para ese jugador
  if (player2.x !== cols - 1 || player2.y !== rows - 1) {
    if (!iaPlayers.some(ia => ia.target === player2)) {
      iaPlayers.push({ x: cols - 1, y: rows - 1, color: 'white', target: player2 });
    }
  }
  if (player1.x !== 0 || player1.y !== 0) {
    if (!iaPlayers.some(ia => ia.target === player1)) {
      iaPlayers.push({ x: 0, y: 0, color: 'white', target: player1 });
    }
  }
}

// Algoritmo A* para encontrar el camino más corto de la IA al jugador
function findPathAStar(start, goal) {
  let openSet = [];
  let closedSet = new Set();
  let cameFrom = {};
  let gScore = {};
  let fScore = {};
  function key(x, y) { return x + ',' + y; }
  openSet.push({x: start.x, y: start.y});
  gScore[key(start.x, start.y)] = 0;
  fScore[key(start.x, start.y)] = Math.abs(goal.x - start.x) + Math.abs(goal.y - start.y);

  while (openSet.length > 0) {
    // Buscar el nodo con menor fScore
    let currentIdx = 0;
    for (let i = 1; i < openSet.length; i++) {
      let k = key(openSet[i].x, openSet[i].y);
      if (fScore[k] < fScore[key(openSet[currentIdx].x, openSet[currentIdx].y)]) {
        currentIdx = i;
      }
    }
    let current = openSet[currentIdx];
    if (current.x === goal.x && current.y === goal.y) {
      // Reconstruir camino
      let path = [];
      let currKey = key(goal.x, goal.y);
      while (cameFrom[currKey]) {
        let [px, py] = cameFrom[currKey].split(',').map(Number);
        path.unshift({x: px, y: py});
        currKey = cameFrom[currKey];
      }
      return path;
    }
    openSet.splice(currentIdx, 1);
    closedSet.add(key(current.x, current.y));
    // Vecinos
    let neighbors = [];
    let dirs = [[0,-1],[1,0],[0,1],[-1,0]];
    for (let d = 0; d < 4; d++) {
      let nx = current.x + dirs[d][0];
      let ny = current.y + dirs[d][1];
      if (canMovePlayer({x: current.x, y: current.y}, nx, ny)) {
        neighbors.push({x: nx, y: ny});
      }
    }
    for (let neighbor of neighbors) {
      let nKey = key(neighbor.x, neighbor.y);
      if (closedSet.has(nKey)) continue;
      let tentative_gScore = gScore[key(current.x, current.y)] + 1;
      if (gScore[nKey] === undefined || tentative_gScore < gScore[nKey]) {
        cameFrom[nKey] = key(current.x, current.y);
        gScore[nKey] = tentative_gScore;
        fScore[nKey] = tentative_gScore + Math.abs(goal.x - neighbor.x) + Math.abs(goal.y - neighbor.y);
        if (!openSet.some(n => n.x === neighbor.x && n.y === neighbor.y)) {
          openSet.push({x: neighbor.x, y: neighbor.y});
        }
      }
    }
  }
  return [];
}

function moveIAPlayers() {
  let iaMoved = false;
  for (let ia of iaPlayers) {
    let jugador = ia.target;
    // Si ya está en la posición del jugador, atrapa
    if (ia.x === jugador.x && ia.y === jugador.y) {
      // Animación de atrapado
      const canvasPlayer = document.getElementById('canvas');
      canvasPlayer.classList.add('jugador-atrapado');
      setTimeout(() => canvasPlayer.classList.remove('jugador-atrapado'), 800);
      // Sin alert, solo respawn
      if (jugador.color === 'red') {
        jugador.x = 0;
        jugador.y = 0;
        player1Path = [{x:0, y:0}];
      } else {
        jugador.x = cols-1;
        jugador.y = rows-1;
        player2Path = [{x:cols-1, y:rows-1}];
      }
      iaPlayers = iaPlayers.filter(other => other !== ia);
      // Redibujar para mostrar el respawn
      drawMaze();
      drawPlayer(player1);
      drawPlayer(player2);
      drawIAPlayers();
      continue;
    }
    // Movimiento óptimo: siempre el primer paso del camino A*
    let path = findPathAStar({x: ia.x, y: ia.y}, {x: jugador.x, y: jugador.y});
    if (path.length > 0) {
      // Si el jugador está adyacente, moverse directamente a su casilla
      let ady = [
        {x: ia.x+1, y: ia.y},
        {x: ia.x-1, y: ia.y},
        {x: ia.x, y: ia.y+1},
        {x: ia.x, y: ia.y-1}
      ];
      let puedeTocar = ady.find(p => p.x === jugador.x && p.y === jugador.y && canMovePlayer(ia, p.x, p.y));
      if (puedeTocar) {
        ia.x = jugador.x;
        ia.y = jugador.y;
        // Forzar atrapado inmediato
        const canvasPlayer = document.getElementById('canvas');
        canvasPlayer.classList.add('jugador-atrapado');
        setTimeout(() => canvasPlayer.classList.remove('jugador-atrapado'), 800);
        if (jugador.color === 'red') {
          jugador.x = 0;
          jugador.y = 0;
          player1Path = [{x:0, y:0}];
        } else {
          jugador.x = cols-1;
          jugador.y = rows-1;
          player2Path = [{x:cols-1, y:rows-1}];
        }
        iaPlayers = iaPlayers.filter(other => other !== ia);
        drawMaze();
        drawPlayer(player1);
        drawPlayer(player2);
        drawIAPlayers();
        continue;
      }
      // Si no está adyacente, seguir el camino A*
      // ¡CORRECCIÓN! El primer paso debe ser path[0], pero si path[0] es la posición actual, tomar path[1]
      let next = (path[0].x === ia.x && path[0].y === ia.y && path.length > 1) ? path[1] : path[0];
      if (next && canMovePlayer(ia, next.x, next.y)) {
        ia.x = next.x;
        ia.y = next.y;
        iaMoved = true;
        continue;
      }
    }
    // Si no hay camino, intentar moverse a cualquier adyacente válido
    let dirs = [[0,-1],[1,0],[0,1],[-1,0]];
    for (let d = 0; d < 4; d++) {
      let nx = ia.x + dirs[d][0];
      let ny = ia.y + dirs[d][1];
      if (canMovePlayer(ia, nx, ny)) {
        ia.x = nx;
        ia.y = ny;
        iaMoved = true;
        break;
      }
    }
  }
  // Redibujar tras mover IA
  if (iaMoved) {
    drawMaze();
    drawPlayer(player1);
    drawPlayer(player2);
    drawIAPlayers();
  }
}

function drawIAPlayers() {
  for (let ia of iaPlayers) {
    drawPlayer(ia);
  }
}

function gameLoop(){
  drawMaze();
  drawPlayer(player1);
  drawPlayer(player2);
  drawIAPlayers();
  requestAnimationFrame(gameLoop);
}

// Controles teclado
window.addEventListener('keydown', e => {
  // Prevenir scroll con flechas y espacio
  if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," ","Spacebar"].includes(e.key)) {
    e.preventDefault();
  }
  keysPressed[e.key.toLowerCase()] = true;

  // Jugador 1 (WASD)
  if(e.key.toLowerCase() === 'w') movePlayer(player1, 'up');
  if(e.key.toLowerCase() === 'a') movePlayer(player1, 'left');
  if(e.key.toLowerCase() === 's') movePlayer(player1, 'down');
  if(e.key.toLowerCase() === 'd') movePlayer(player1, 'right');

  // Jugador 2 (Flechas)
  if(e.key === 'ArrowUp') movePlayer(player2, 'up');
  if(e.key === 'ArrowLeft') movePlayer(player2, 'left');
  if(e.key === 'ArrowDown') movePlayer(player2, 'down');
  if(e.key === 'ArrowRight') movePlayer(player2, 'right');
});

window.addEventListener('keyup', e => {
  keysPressed[e.key.toLowerCase()] = false;
});

function startGame(){
  const difficultySelect = document.getElementById('difficulty');
  let difficulty = parseInt(difficultySelect.value);
  cols = difficulty;
  rows = difficulty;
  cellSize = Math.floor(Math.min(canvas.width, canvas.height) / cols);
  generateMaze();
  // Posicionar jugadores en extremos opuestos
  player1.x = 0;
  player1.y = 0;
  player2.x = cols - 1;
  player2.y = rows - 1;
  // Inicializar historial de rutas
  player1Path = [{x:0, y:0}];
  player2Path = [{x:cols-1, y:rows-1}];
  // Posición metas (opuestos)
  goal1 = {x: cols - 1, y: rows - 1};
  goal2 = {x: 0, y: 0};
  iaPlayers = [];
  if (iaInterval) clearInterval(iaInterval);
  if (iaTimeout) clearTimeout(iaTimeout);
  // DIBUJAR LABERINTO Y JUGADORES INMEDIATAMENTE
  drawMaze();
  drawPlayer(player1);
  drawPlayer(player2);
  drawIAPlayers();
  setTimeout(() => {
    spawnIAPlayers();
    if (iaInterval) clearInterval(iaInterval);
    iaInterval = setInterval(moveIAPlayers, iaSpeed);
  }, 1000);
}

// --- MENÚ PRINCIPAL ---
function crearMenuPrincipal() {
  if (document.getElementById('mainMenu')) return;
  const menu = document.createElement('div');
  menu.id = 'mainMenu';
  menu.style.position = 'fixed';
  menu.style.top = '0';
  menu.style.left = '0';
  menu.style.width = '100vw';
  menu.style.height = '100vh';
  menu.style.background = '#111d';
  menu.style.zIndex = '10';
  menu.style.display = 'flex';
  menu.style.flexDirection = 'column';
  menu.style.alignItems = 'center';
  menu.style.justifyContent = 'center';
  menu.innerHTML = `
    <h2>Menú de Juego</h2>
    <label>Dificultad (Tamaño Laberinto):
      <select id="difficulty">
        <option value="10">Fácil (10x10)</option>
        <option value="15" selected>Medio (15x15)</option>
        <option value="20">Difícil (20x20)</option>
      </select>
    </label><br><br>
    <button id="startBtnMenu">Iniciar Juego</button>
  `;
  document.body.appendChild(menu);
  document.getElementById('startBtnMenu').onclick = () => {
    startGame();
    menu.style.display = 'none';
  };
}

// Mostrar menú al cargar
window.addEventListener('DOMContentLoaded', crearMenuPrincipal);

// Al final del archivo principal:
// Cargar scripts modulares
// (Asegúrate de que esto esté en el HTML, pero lo agrego aquí para referencia)
// <script src="laberinto.js"></script>
// <script src="jugador.js"></script>
// <script src="ia.js"></script>
// <script src="main.js"></script>

startGame();
gameLoop();

function showFireworksAndNextLevel(player) {
  // Crear overlay para animación y botón
  let overlay = document.createElement('div');
  overlay.id = 'fireworksOverlay';
  overlay.style.position = 'fixed';
  overlay.style.top = 0;
  overlay.style.left = 0;
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.background = 'rgba(0,0,0,0.55)';
  overlay.style.display = 'flex';
  overlay.style.flexDirection = 'column';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = 1000;
  overlay.innerHTML = `
    <canvas id="fireworksCanvas" width="600" height="400" style="background:transparent;"></canvas>
    <h2 style="color:#fff;text-shadow:2px 2px 8px #000a;">¡${player.name} llegó a la meta!</h2>
    <button id="nextLevelBtn" style="margin-top:24px;padding:12px 32px;font-size:1.2em;background:linear-gradient(90deg,#ffb347,#ffcc33);border:none;border-radius:8px;cursor:pointer;box-shadow:0 2px 8px #0005;">Siguiente Nivel</button>
  `;
  document.body.appendChild(overlay);
  // Fuegos artificiales básicos
  let fwCanvas = document.getElementById('fireworksCanvas');
  let fwCtx = fwCanvas.getContext('2d');
  let particles = [];
  function launchFirework() {
    let colors = ['#ffb347','#ffcc33','#00ff7f','#fff','#ff4b2b','#00c3ff'];
    let x = Math.random()*fwCanvas.width*0.8+fwCanvas.width*0.1;
    let y = Math.random()*fwCanvas.height*0.5+fwCanvas.height*0.1;
    let color = colors[Math.floor(Math.random()*colors.length)];
    for(let i=0;i<32;i++){
      let angle = (Math.PI*2)*i/32;
      let speed = Math.random()*3+2;
      particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,alpha:1,color});
    }
  }
  function drawFireworks() {
    fwCtx.clearRect(0,0,fwCanvas.width,fwCanvas.height);
    for(let p of particles) {
      fwCtx.save();
      fwCtx.globalAlpha = p.alpha;
      fwCtx.beginPath();
      fwCtx.arc(p.x,p.y,3,0,Math.PI*2);
      fwCtx.fillStyle = p.color;
      fwCtx.shadowColor = p.color;
      fwCtx.shadowBlur = 12;
      fwCtx.fill();
      fwCtx.restore();
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.97;
      p.vy *= 0.97;
      p.alpha -= 0.012;
    }
    particles = particles.filter(p=>p.alpha>0.05);
    if(Math.random()<0.04) launchFirework();
    requestAnimationFrame(drawFireworks);
  }
  for(let i=0;i<3;i++) setTimeout(launchFirework, i*400);
  drawFireworks();
  document.getElementById('nextLevelBtn').onclick = () => {
    overlay.remove();
    startGame();
  };
}
