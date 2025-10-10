// gameManager.js
const { v4: uuidv4 } = require('uuid');
const { initGamePhases } = require('./gamePhases');
const { cleanupGame, findGameBySocket, safeEmit } = require('./gameUtils');
const { generateDisconnectMessage } = require('./storyGenerator');

function initGameManager(io) {
    const games = new Map();
    const phases = initGamePhases(io, games);

    // --- Socket Handlers ---
    function handleCreateGame(socket, playerName) {
        const gameCode = uuidv4().substring(0, 6).toUpperCase();
        const game = {
            id: gameCode,
            host: socket.id,
            players: [{ id: socket.id, name: playerName, alive: true, voted: false }],
            currentStory: null,
            submissions: {},
            votes: {},
            phase: 'waiting',
            timer: null,
            availableItems: [],
            roundNumber: 0
        };
        games.set(gameCode, game);

        socket.join(game.id);
        socket.emit('game-created', { gameCode: game.id, player: game.players[0] });
        safeEmit(game, io, 'game-state-update', game);
    }

    function handleJoinGame(socket, { gameCode, playerName }) {
        const game = games.get(gameCode);
        if (!game) return socket.emit('error', 'Game not found!');
        const player = { id: socket.id, name: playerName, alive: true, voted: false };
        game.players.push(player);
        socket.join(game.id);
        socket.emit('player-joined', player);
        safeEmit(game, io, 'game-state-update', game);
    }

    function handleStartGame(socket) {
        const game = findGameBySocket(games, socket.id);
        if (game && game.host === socket.id && game.players.length >= 2) phases.startGame(game);
    }

    function handleSubmitAction(socket, data) {
        const game = findGameBySocket(games, socket.id);
        if (game && game.phase === 'submit') {
            game.submissions[socket.id] = {
                text: data.action,
                item: game.players.find(p => p.id === socket.id).currentItem
            };
            safeEmit(game, io, 'player-submitted', { submittedCount: Object.keys(game.submissions).length });
            if (Object.keys(game.submissions).length === game.players.filter(p => p.alive).length) {
                clearTimeout(game.timer);
                phases.showStoryResolution(game);
            }
        }
    }

    function handleSubmitVote(socket, votedPlayerId) {
        const game = findGameBySocket(games, socket.id);
        if (game && game.phase === 'vote') {
            game.votes[socket.id] = votedPlayerId;
            game.players.find(p => p.id === socket.id).voted = true;
            safeEmit(game, io, 'vote-update', game.votes);
            if (game.players.filter(p => p.alive).every(p => p.voted)) {
                clearTimeout(game.timer);
                phases.endVoting(game);
            }
        }
    }

    function handleDisconnect(socket) {
        for (const game of games.values()) {
            const player = game.players.find(p => p.id === socket.id);
            if (!player) continue;
            game.players = game.players.filter(p => p.id !== socket.id);
            safeEmit(game, io, 'player-disconnected', {
                player: player.name,
                message: generateDisconnectMessage(player.name)
            });
            if (game.players.length < 2) cleanupGame(game);
        }
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
