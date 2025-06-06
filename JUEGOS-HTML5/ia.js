// ia.js
// Lógica de la IA del laberinto

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
    let currentIdx = 0;
    for (let i = 1; i < openSet.length; i++) {
      let k = key(openSet[i].x, openSet[i].y);
      if (fScore[k] < fScore[key(openSet[currentIdx].x, openSet[currentIdx].y)]) {
        currentIdx = i;
      }
    }
    let current = openSet[currentIdx];
    if (current.x === goal.x && current.y === goal.y) {
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
    if (ia.x === jugador.x && ia.y === jugador.y) {
      // Animación de atrapado
      const canvasPlayer = document.getElementById('canvas');
      canvasPlayer.classList.add('jugador-atrapado');
      setTimeout(() => canvasPlayer.classList.remove('jugador-atrapado'), 800);
      // Solo mostrar alert si es el azul
      if (jugador.color === 'red') {
        jugador.x = 0;
        jugador.y = 0;
        player1Path = [{x:0, y:0}];
      } else {
        jugador.x = cols-1;
        jugador.y = rows-1;
        player2Path = [{x:cols-1, y:rows-1}];
        alert("¡La IA te atrapó!");
      }
      iaPlayers = iaPlayers.filter(other => other !== ia);
      drawMaze();
      drawPlayer(player1);
      drawPlayer(player2);
      drawIAPlayers();
      continue;
    }
    let path = findPathAStar({x: ia.x, y: ia.y}, {x: jugador.x, y: jugador.y});
    if (path.length > 0) {
      let next = null;
      for (let step of path) {
        if ((step.x === jugador.x && step.y === jugador.y) || (Math.abs(step.x - ia.x) + Math.abs(step.y - ia.y)) === 1) {
          next = step;
          break;
        }
      }
      if (next && canMovePlayer(ia, next.x, next.y)) {
        ia.x = next.x;
        ia.y = next.y;
        iaMoved = true;
        continue;
      }
    }
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

window.spawnIAPlayers = spawnIAPlayers;
window.moveIAPlayers = moveIAPlayers;
window.drawIAPlayers = drawIAPlayers;
window.findPathAStar = findPathAStar;
