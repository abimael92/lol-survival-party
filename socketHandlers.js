// socketHandlers.js
const { initGameManager } = require('./gameManager');

function initSocketHandlers(io) {
    const gameManager = initGameManager(io);

    io.on('connection', socket => {
        console.log('New client connected:', socket.id);

        socket.on('create-game', playerName => gameManager.handleCreateGame(socket, playerName));
        socket.on('join-game', data => gameManager.handleJoinGame(socket, data));
        socket.on('start-game', () => gameManager.handleStartGame(socket));
        socket.on('submit-action', data => gameManager.handleSubmitAction(socket, data));
        socket.on('submit-vote', votedPlayerId => gameManager.handleSubmitVote(socket, votedPlayerId));
        socket.on('disconnect', () => gameManager.handleDisconnect(socket));

        socket.onAny((eventName, ...args) => {
            console.log(`Socket event: ${eventName}`, args);
        });
    });
}

module.exports = { initSocketHandlers };
