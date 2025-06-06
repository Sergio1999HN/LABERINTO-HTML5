// server.js
// Servidor WebSocket para partidas online de Laberinto

const http = require('http');
const WebSocket = require('ws');

const PORT = process.env.PORT || 8080;

// Servidor HTTP básico para Render
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Servidor WebSocket de Laberinto activo');
});

const wss = new WebSocket.Server({ server });
let rooms = {};

wss.on('connection', ws => {
  ws.on('message', msg => {
    let data;
    try {
      data = JSON.parse(msg);
    } catch (e) {
      return;
    }
    if (data.room) {
      ws.room = data.room;
      if (!rooms[data.room]) rooms[data.room] = [];
      if (!rooms[data.room].includes(ws)) rooms[data.room].push(ws);
      // Reenvía a todos en la sala menos al emisor
      rooms[data.room].forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    }
  });
  ws.on('close', () => {
    if (ws.room && rooms[ws.room]) {
      rooms[ws.room] = rooms[ws.room].filter(client => client !== ws);
      if (rooms[ws.room].length === 0) delete rooms[ws.room];
    }
  });
});

server.listen(PORT, () => {
  console.log(`Servidor WebSocket de Laberinto escuchando en puerto ${PORT}`);
});
