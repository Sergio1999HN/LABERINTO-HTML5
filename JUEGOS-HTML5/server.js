// server.js
// Servidor WebSocket para partidas online de Laberinto

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });
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

console.log('Servidor WebSocket de Laberinto escuchando en ws://localhost:8080');
