const { v4: uuidv4 } = require('uuid');
const {
    getRandomStory,
    generatePlayerList,
    generateSillyResolution,
    generateDeathMessage,
    generateContinuationStory,
    generateNewCrisis,
    generateFinalStoryEnding,
    generateFullStoryRecap,
    generateDisconnectMessage
} = require('./storyGenerator');

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function countVotes(votes) {
    const counts = {};
    Object.values(votes).forEach(v => counts[v] = (counts[v] || 0) + 1);
    return counts;
}

function initGameManager(io) {
    const games = new Map();

    function safeEmit(game, event, data) {
        if (game.phase === 'ended') return;
        io.to(game.id).emit(event, data);
    }

    function cleanupGame(game) {
        if (game.timer) clearTimeout(game.timer);
        game.phase = 'ended';
    }

    function createGame(hostId) {
        const gameCode = uuidv4().slice(0, 6).toUpperCase();
        const game = {
            id: gameCode,
            host: hostId,
            players: [],
            currentStory: null,
            submissions: {},
            votes: {},
            phase: 'waiting',
            timer: null,
            roundNumber: 0,
            availableItems: []
        };
        games.set(gameCode, game);
        return game;
    }

    function findGameBySocket(socketId) {
        return [...games.values()].find(g => g.players.some(p => p.id === socketId));
    }

    function startGame(game) {
        if (game.phase === 'ended') return;
        game.phase = 'story';
        game.roundNumber++;

        if (game.roundNumber === 1) {
            const story = getRandomStory();
            game.currentStory = story;
            game.storyIntroduction = story.intro.replace('{players}', generatePlayerList(game.players));
        } else {
            game.currentStory.crisis = generateNewCrisis(game.currentStory, game.roundNumber);
        }

        game.availableItems = [...game.currentStory.items];
        shuffleArray(game.availableItems);

        game.players.forEach(p => {
            if (p.alive)
                p.currentItem = game.availableItems.pop() || game.currentStory.items[Math.floor(Math.random() * game.currentStory.items.length)];
            p.voted = false;
        });

        game.submissions = {};
        game.votes = {};

        game.players.forEach(p => {
            if (p.alive) io.to(p.id).emit('new-story', {
                introduction: game.roundNumber === 1 ? game.storyIntroduction : null,
                scenario: game.currentStory.scenario,
                crisis: game.currentStory.crisis,
                playerItem: p.currentItem,
                roundNumber: game.roundNumber
            });
        });

        game.timer = setTimeout(() => {
            if (game.phase === 'ended') return;
            game.phase = 'submit';
            safeEmit(game, 'phase-change', 'submit');
            game.timer = setTimeout(() => {
                if (game.phase !== 'ended') showStoryResolution(game);
            }, 30000); // halved from 60000
        }, 10000); // halved from 20000
    }

    function showStoryResolution(game) {
        if (game.phase === 'ended') return;
        game.phase = 'story-resolution';
        const submissionsForResolution = {};
        Object.keys(game.submissions).forEach(pid => {
            const player = game.players.find(p => p.id === pid);
            if (player) submissionsForResolution[pid] = {
                text: game.submissions[pid].text,
                item: game.submissions[pid].item,
                playerName: player.name
            };
        });
        const sillyResolution = generateSillyResolution(submissionsForResolution, game.currentStory.crisis);
        safeEmit(game, 'story-resolution', { submissions: submissionsForResolution, resolution: sillyResolution });
        game.timer = setTimeout(() => { if (game.phase !== 'ended') startVoting(game); }, 7500); // halved
    }

    function startVoting(game) {
        if (game.phase === 'ended') return;
        clearTimeout(game.timer);
        game.phase = 'vote';
        game.players.forEach(p => p.voted = false);

        const submissionsForVoting = {};
        Object.keys(game.submissions).forEach(pid => {
            const player = game.players.find(p => p.id === pid);
            if (player) submissionsForVoting[pid] = {
                text: game.submissions[pid].text,
                item: game.submissions[pid].item,
                playerName: player.name
            };
        });

        safeEmit(game, 'submissions-to-vote-on', {
            prompt: "Who should be left behind?",
            submissions: submissionsForVoting
        });

        game.timer = setTimeout(() => { if (game.phase !== 'ended') endVoting(game); }, 22500); // halved
    }

    function endVoting(game) {
        clearTimeout(game.timer);
        const voteCounts = countVotes(game.votes);
        let maxVotes = 0, sacrificedId = null;
        for (const [pid, v] of Object.entries(voteCounts))
            if (v > maxVotes) { maxVotes = v; sacrificedId = pid; }

        const tied = Object.entries(voteCounts).filter(([_, v]) => v === maxVotes).map(([p]) => p);
        if (tied.length > 1) sacrificedId = tied[Math.floor(Math.random() * tied.length)];

        const sacrificed = game.players.find(p => p.id === sacrificedId);
        if (sacrificed) sacrificed.alive = false;

        const alivePlayers = game.players.filter(p => p.alive);

        if (alivePlayers.length > 1) {
            startGame(game);
        } else if (alivePlayers.length === 1) {
            const winner = alivePlayers[0];
            safeEmit(game, 'game-winner', {
                winner,
                story: generateFinalStoryEnding(winner, game),
                recap: generateFullStoryRecap(game)
            });
            cleanupGame(game);
        } else {
            safeEmit(game, 'game-draw', {
                message: 'Everyone eliminated!',
                recap: generateFullStoryRecap(game)
            });
            cleanupGame(game);
        }
    }

    function handleCreateGame(socket, playerName) {
        const game = createGame(socket.id);
        const newPlayer = { id: socket.id, name: playerName, alive: true, voted: false };
        game.players.push(newPlayer);
        socket.join(game.id);
        socket.emit('game-created', { gameCode: game.id, player: newPlayer });
        safeEmit(game, 'game-state-update', game);
    }

    function handleJoinGame(socket, data) {
        const game = games.get(data.gameCode);
        if (!game) return socket.emit('error', 'Game not found!');
        const newPlayer = { id: socket.id, name: data.playerName, alive: true, voted: false };
        game.players.push(newPlayer);
        socket.join(game.id);
        socket.emit('player-joined', newPlayer);
        safeEmit(game, 'game-state-update', game);
    }

    function handleStartGame(socket) {
        const game = findGameBySocket(socket.id);
        if (game && game.host === socket.id && game.players.length >= 2) startGame(game);
    }

    function handleSubmitAction(socket, data) {
        const game = findGameBySocket(socket.id);
        if (!game || game.phase !== 'submit') return;
        const player = game.players.find(p => p.id === socket.id);
        if (player) game.submissions[socket.id] = { text: data.action, item: player.currentItem };
        safeEmit(game, 'player-submitted', { submittedCount: Object.keys(game.submissions).length });
        if (Object.keys(game.submissions).length === game.players.filter(p => p.alive).length)
            showStoryResolution(game);
    }

    function handleSubmitVote(socket, votedId) {
        const game = findGameBySocket(socket.id);
        if (!game || game.phase !== 'vote') return;
        game.votes[socket.id] = votedId;
        const voter = game.players.find(p => p.id === socket.id);
        if (voter) voter.voted = true;
        socket.emit('vote-confirmed', votedId);
        safeEmit(game, 'vote-update', countVotes(game.votes));
        if (game.players.filter(p => p.alive).every(p => p.voted)) endVoting(game);
    }

    function handleDisconnect(socket) {
        for (const [code, game] of games) {
            const player = game.players.find(p => p.id === socket.id);
            if (!player) continue;
            game.players = game.players.filter(p => p.id !== socket.id);
            if (game.host === socket.id && game.players.length) game.host = game.players[0].id;
            safeEmit(game, 'player-disconnected', { player: player.name, message: generateDisconnectMessage(player.name) });
            safeEmit(game, 'game-state-update', game);
            if (game.players.filter(p => p.alive).length < 2 && !['waiting', 'ended'].includes(game.phase)) {
                game.phase = 'ended';
                safeEmit(game, 'game-ended', 'Not enough players');
            }
            if (!game.players.length) games.delete(code);
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
