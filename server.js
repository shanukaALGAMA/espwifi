const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Store messages for HTTP clients
let messages = [];
const webAppClients = new Set();
const esp32Clients = new Set();

// WebSocket connection (keep your existing React app working)
wss.on('connection', (ws, req) => {
  const isESP32 = req.url.includes('/esp32');
  
  if (isESP32) {
    esp32Clients.add(ws);
    ws.on('message', (message) => {
      webAppClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message.toString());
        }
      });
    });
  } else {
    webAppClients.add(ws);
  }

  ws.on('close', () => {
    isESP32 ? esp32Clients.delete(ws) : webAppClients.delete(ws);
  });
});

// Keep your original GET endpoint (for React compatibility)
app.get('/send-to-esp', (req, res) => {
  const message = req.query.msg || '';
  
  // Send via WebSocket
  esp32Clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
  
  // Also store for HTTP retrieval
  messages.push({
    message,
    timestamp: new Date().toISOString()
  });
  
  res.json({ success: true });
});

// Add new endpoint for ESP32 HTTPClient
app.get('/get-messages', (req, res) => {
  res.json({ messages });
  messages = []; // Clear after retrieval
});

server.listen(8080, () => {
  console.log('Server running on http://localhost:8080');
});