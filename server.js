// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { initSocketHandlers } = require('./socketHandlers');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// Initialize socket handlers
initSocketHandlers(io);

const PORT = 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
