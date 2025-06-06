// online.js
// Script para alojar y unirse a partidas online (básico, solo lógica de sala y sincronización por WebSocket)

// NOTA: Esto es un esqueleto básico. Requiere un servidor WebSocket real para funcionar en producción.

let ws = null;
let onlineRoomId = null;
let isHost = false;

function hostGame() {
  ws = new WebSocket('ws://localhost:8080'); // Cambia por tu IP local si invitas a alguien en tu red
  ws.onopen = () => {
    isHost = true;
    onlineRoomId = Math.random().toString(36).substr(2, 6).toUpperCase();
    showRoomInfo(onlineRoomId, true);
  };
  ws.onmessage = (msg) => {
    let data = JSON.parse(msg.data);
    if (data.type === 'move') {
      // El invitado mueve su jugador
      if (data.player === 'player2') {
        player2.x = data.x;
        player2.y = data.y;
        drawMaze();
        drawPlayer(player1);
        drawPlayer(player2);
        drawIAPlayers();
      }
    }
  };
}

function joinGame(roomId) {
  ws = new WebSocket('ws://localhost:8080'); // Cambia por la IP del host si te conectas desde otra PC
  ws.onopen = () => {
    isHost = false;
    onlineRoomId = roomId;
    showRoomInfo(roomId, false);
  };
  ws.onmessage = (msg) => {
    let data = JSON.parse(msg.data);
    if (data.type === 'move') {
      // El host mueve su jugador
      if (data.player === 'player1') {
        player1.x = data.x;
        player1.y = data.y;
        drawMaze();
        drawPlayer(player1);
        drawPlayer(player2);
        drawIAPlayers();
      }
    }
  };
}

function sendMoveOnline(player, x, y) {
  if (!ws || ws.readyState !== 1) return;
  let type = 'move';
  let who = (player === player1) ? 'player1' : 'player2';
  ws.send(JSON.stringify({ type, player: who, x, y, room: onlineRoomId }));
}

function showRoomInfo(roomId, isHost) {
  let overlay = document.createElement('div');
  overlay.id = 'onlineOverlay';
  overlay.style.position = 'fixed';
  overlay.style.top = 0;
  overlay.style.left = 0;
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.background = 'rgba(0,0,0,0.7)';
  overlay.style.display = 'flex';
  overlay.style.flexDirection = 'column';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = 2000;
  overlay.innerHTML = `
    <h2 style="color:#fff">Sala: <span style="color:#ffb347">${roomId}</span></h2>
    <p style="color:#fff">${isHost ? 'Comparte este código con tu amigo para que se una.' : 'Esperando al host...'}</p>
    <button id="closeOnlineBtn" style="margin-top:24px;padding:10px 28px;font-size:1.1em;background:linear-gradient(90deg,#ffb347,#ffcc33);border:none;border-radius:8px;cursor:pointer;box-shadow:0 2px 8px #0005;">Salir</button>
  `;
  document.body.appendChild(overlay);
  document.getElementById('closeOnlineBtn').onclick = () => {
    if (ws) ws.close();
    overlay.remove();
    onlineRoomId = null;
    isHost = false;
  };
}

// Para integración: llama a hostGame() para alojar, joinGame(roomId) para unirse.
// Llama a sendMoveOnline(player, x, y) cada vez que un jugador se mueva.
