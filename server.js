const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files
app.use(express.static('public'));

// Import game manager
const { initGameManager } = require('./gameManager');

// Initialize game manager
const gameManager = initGameManager(io);

// Socket connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('create-game', (playerName) => {
        gameManager.handleCreateGame(socket, playerName);
    });

    socket.on('join-game', (data) => {
        gameManager.handleJoinGame(socket, data);
    });

    socket.on('start-game', () => {
        gameManager.handleStartGame(socket);
    });

    socket.on('submit-action', (data) => {
        gameManager.handleSubmitAction(socket, data);
    });

    socket.on('submit-vote', (votedPlayerId) => {
        gameManager.handleSubmitVote(socket, votedPlayerId);
    });

    socket.on('disconnect', () => {
        gameManager.handleDisconnect(socket);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});