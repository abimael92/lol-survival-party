// gameManager.js
const { v4: uuidv4 } = require('uuid');

function initGameManager(io) {
    const games = {}; // { gameId: { players: [], state, votes, stories } }

    function handleCreateGame(socket, playerName) {
        const gameId = uuidv4();
        games[gameId] = {
            players: [{ id: socket.id, name: playerName }],
            state: 'waiting',
            votes: {},
            stories: {}
        };
        socket.join(gameId);
        socket.emit('game-created', { gameId });
        console.log(`Game ${gameId} created by ${playerName}`);
    }

    function handleJoinGame(socket, { gameId, playerName }) {
        const game = games[gameId];
        if (!game) {
            socket.emit('error', 'Game not found');
            return;
        }
        game.players.push({ id: socket.id, name: playerName });
        socket.join(gameId);
        io.to(gameId).emit('player-joined', { player: playerName });
        console.log(`${playerName} joined game ${gameId}`);
    }

    function handleStartGame(socket) {
        const gameId = findGameBySocket(socket.id);
        if (!gameId) return;

        const game = games[gameId];
        game.state = 'in-progress';
        io.to(gameId).emit('game-started', { players: game.players });
        console.log(`Game ${gameId} started`);
    }

    function handleSubmitAction(socket, { story }) {
        const gameId = findGameBySocket(socket.id);
        if (!gameId) return;

        const game = games[gameId];
        game.stories[socket.id] = story;
        io.to(gameId).emit('story-submitted', { playerId: socket.id, story });
        console.log(`Player ${socket.id} submitted story: ${story}`);
    }

    function handleSubmitVote(socket, votedPlayerId) {
        const gameId = findGameBySocket(socket.id);
        if (!gameId) return;

        const game = games[gameId];
        game.votes[socket.id] = votedPlayerId;

        if (Object.keys(game.votes).length === game.players.length) {
            // All votes in
            io.to(gameId).emit('votes-complete', { votes: game.votes });
            console.log(`Votes complete for game ${gameId}`);
        }
    }

    function handleDisconnect(socket) {
        const gameId = findGameBySocket(socket.id);
        if (!gameId) return;

        const game = games[gameId];
        const playerIndex = game.players.findIndex(p => p.id === socket.id);
        if (playerIndex !== -1) {
            const playerName = game.players[playerIndex].name;
            game.players.splice(playerIndex, 1);
            io.to(gameId).emit('player-left', { player: playerName });
            console.log(`${playerName} disconnected from game ${gameId}`);
        }

        if (game.players.length === 0) {
            delete games[gameId];
            console.log(`Game ${gameId} deleted (no players left)`);
        }
    }

    function findGameBySocket(socketId) {
        return Object.keys(games).find(
            gameId => games[gameId].players.some(p => p.id === socketId)
        );
    }

    return {
        handleCreateGame,
        handleJoinGame,
        handleStartGame,
        handleSubmitAction,
        handleSubmitVote,
        handleDisconnect
    };
}

module.exports = { initGameManager };
