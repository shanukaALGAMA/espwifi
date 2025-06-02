const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Store messages (in-memory for simplicity)
let messages = [];

// Web App sends messages
app.post('/send-to-esp', (req, res) => {
  const message = req.body.message;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  messages.push({
    message,
    timestamp: new Date().toISOString()
  });
  
  res.json({ success: true });
});

// ESP32 retrieves messages
app.get('/get-messages', (req, res) => {
  res.json({ messages });
  messages = []; // Clear after retrieval (adjust based on your needs)
});

module.exports = app;