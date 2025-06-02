const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Store all connected clients
const webAppClients = new Set(); // For React web app
const esp32Clients = new Set();  // For ESP32 devices

wss.on('connection', (ws, req) => {
  // Check if connection is from ESP32 (you can add more robust authentication)
  const isESP32 = req.url.includes('/esp32');
  
  if (isESP32) {
    console.log('New ESP32 connected');
    esp32Clients.add(ws);
    
    ws.on('message', (message) => {
      console.log(`Message from ESP32: ${message}`);
      // Forward to all web app clients
      webAppClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message.toString());
        }
      });
    });
  } else {
    console.log('New Web App connected');
    webAppClients.add(ws);
  }

  ws.on('close', () => {
    if (isESP32) {
      esp32Clients.delete(ws);
      console.log('ESP32 disconnected');
    } else {
      webAppClients.delete(ws);
      console.log('Web App disconnected');
    }
  });
});

// HTTP endpoint for web app to send messages
app.get('/send-to-esp', (req, res) => {
  const message = req.query.msg || '';
  
  esp32Clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
  
  res.json({ success: true, message: 'Message sent to ESP32' });
});

server.listen(8080, () => {
  console.log('Server running on http://localhost:8080');
});