// gameManager.js
const { v4: uuidv4 } = require('uuid');

function initGameManager(io) {
    const games = {}; // { gameId: { players: [], state, votes, stories } }

    function handleCreateGame(socket, playerName) {
        const gameId = uuidv4();
        const player = { id: socket.id, name: playerName };

        games[gameId] = {
            players: [player],
            state: 'waiting',
            votes: {},
            stories: {}
        };

        socket.join(gameId);

        // Enviar toda la info que el cliente espera
        socket.emit('game-created', {
            gameCode: gameId,
            player
        });

        console.log(`Game ${gameId} created by ${playerName}`);
    }

    function handleJoinGame(socket, { gameCode, playerName }) {
        const game = games[gameCode];
        if (!game) {
            socket.emit('error', 'Game not found');
            return;
        }
        if (game.state !== 'waiting') {
            socket.emit('error', 'Cannot join, game already started');
            return;
        }

        const player = { id: socket.id, name: playerName };
        game.players.push(player);
        socket.join(gameCode);

        io.to(gameCode).emit('player-joined', player);

        console.log(`${playerName} joined game ${gameCode}`);
    }


    function handleStartGame(socket) {
        const gameId = findGameBySocket(socket.id);
        if (!gameId) return;

        const game = games[gameId];
        if (game.players.length < 2) {
            socket.emit('error', 'Need at least 2 players to start');
            return;
        }

        game.state = 'in-progress';
        io.to(gameId).emit('game-started', { players: game.players });
        console.log(`Game ${gameId} started`);
    }

    function handleSubmitAction(socket, { story }) {
        const gameId = findGameBySocket(socket.id);
        if (!gameId) return;

        const game = games[gameId];
        if (game.state !== 'in-progress') return;

        game.stories[socket.id] = story;
        io.to(gameId).emit('story-submitted', { playerId: socket.id, story });

        // Check if all players submitted
        if (Object.keys(game.stories).length === game.players.length) {
            game.state = 'voting';
            game.votes = {};
            io.to(gameId).emit('all-stories-submitted', { stories: game.stories });
            console.log(`All stories submitted for game ${gameId}`);
        }
    }

    function handleSubmitVote(socket, votedPlayerId) {
        const gameId = findGameBySocket(socket.id);
        if (!gameId) return;

        const game = games[gameId];
        if (game.state !== 'voting') return;

        game.votes[socket.id] = votedPlayerId;

        if (Object.keys(game.votes).length === game.players.length) {
            game.state = 'finished';
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
            io.to(gameId).emit('player-left', { player: playerName, players: game.players });
            console.log(`${playerName} disconnected from game ${gameId}`);
        }

        if (game.players.length === 0) {
            delete games[gameId];
            console.log(`Game ${gameId} deleted (no players left)`);
        }
    }

    function findGameBySocket(socketId) {
        return Object.keys(games).find(gameId =>
            games[gameId].players.some(p => p.id === socketId)
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
