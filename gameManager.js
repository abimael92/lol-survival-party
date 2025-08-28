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

function initGameManager(io) {
    const games = new Map();

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function countVotes(votes) {
        const counts = {};
        Object.values(votes).forEach(votedId => {
            counts[votedId] = (counts[votedId] || 0) + 1;
        });
        return counts;
    }

    function safeEmit(game, event, data) {
        if (game.phase === 'ended') return;
        io.to(game.id).emit(event, data);
    }

    function cleanupGame(game) {
        if (game.timer) clearTimeout(game.timer);
        game.phase = 'ended';
    }

    function createGame(hostId) {
        const gameCode = uuidv4().substring(0, 6).toUpperCase();
        const game = {
            id: gameCode,
            host: hostId,
            players: [],
            currentStory: null,
            storyIntroduction: "",
            submissions: {},
            votes: {},
            phase: 'waiting',
            timer: null,
            availableItems: [],
            roundNumber: 0
        };
        games.set(gameCode, game);
        return game;
    }

    function findGameBySocket(socketId) {
        for (const game of games.values()) {
            if (game.players.some(p => p.id === socketId)) return game;
        }
        return null;
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

        game.players.forEach(player => {
            if (player.alive) {
                player.currentItem = game.availableItems.length ? game.availableItems.pop() : game.currentStory.items[Math.floor(Math.random() * game.currentStory.items.length)];
            }
        });

        game.submissions = {};
        game.votes = {};
        game.players.forEach(p => p.voted = false);

        game.players.forEach(player => {
            if (player.alive) {
                io.to(player.id).emit('new-story', {
                    introduction: game.roundNumber === 1 ? game.storyIntroduction : null,
                    scenario: game.currentStory.scenario,
                    crisis: game.currentStory.crisis,
                    playerItem: player.currentItem
                });
            }
        });

        game.timer = setTimeout(() => {
            if (game.phase === 'ended') return;
            game.phase = 'submit';
            safeEmit(game, 'phase-change', 'submit');

            game.timer = setTimeout(() => {
                if (game.phase === 'ended') return;
                showStoryResolution(game);
            }, 60000);
        }, 20000);
    }

    function showStoryResolution(game) {
        if (game.phase === 'ended') return;

        game.phase = 'story-resolution';
        const submissionsForResolution = {};
        Object.keys(game.submissions).forEach(pid => {
            const player = game.players.find(p => p.id === pid);
            if (player) submissionsForResolution[pid] = { ...game.submissions[pid], playerName: player.name };
        });

        const sillyResolution = generateSillyResolution(submissionsForResolution, game.currentStory.crisis);

        safeEmit(game, 'story-resolution', { submissions: submissionsForResolution, resolution: sillyResolution });

        game.timer = setTimeout(() => { if (game.phase !== 'ended') startVoting(game); }, 15000);
    }

    function startVoting(game) {
        if (game.phase === 'ended') return;
        clearTimeout(game.timer);
        game.phase = 'vote';
        game.players.forEach(p => p.voted = false);

        const submissionsForVoting = {};
        Object.keys(game.submissions).forEach(pid => {
            const player = game.players.find(p => p.id === pid);
            if (player) submissionsForVoting[pid] = { ...game.submissions[pid], playerName: player.name };
        });

        safeEmit(game, 'submissions-to-vote-on', {
            prompt: "All team members contributed... but let's be honest, some plans were better than others. Who should we leave behind?",
            submissions: submissionsForVoting
        });

        game.timer = setTimeout(() => { if (game.phase !== 'ended') endVoting(game); }, 45000);
    }

    // In the endVoting function in gameManager.js (server side)
    // In the endVoting function in gameManager.js (server side) - FIXED
    // In the endVoting function in gameManager.js (server side) - FIXED TIMER ISSUE
    function endVoting(game) {
        debug.logPhase(game, 'Ending voting');
        clearTimeout(game.timer);

        const voteCounts = countVotes(game.votes);
        debug.logVotes(game);

        let maxVotes = 0;
        let sacrificedPlayerId = null;

        for (const [playerId, votes] of Object.entries(voteCounts)) {
            if (votes > maxVotes) {
                maxVotes = votes;
                sacrificedPlayerId = playerId;
            }
        }

        const tiedPlayers = Object.entries(voteCounts)
            .filter(([_, votes]) => votes === maxVotes)
            .map(([playerId, _]) => playerId);

        if (tiedPlayers.length > 1) {
            sacrificedPlayerId = tiedPlayers[Math.floor(Math.random() * tiedPlayers.length)];
        }

        const sacrificedPlayer = game.players.find(p => p.id === sacrificedPlayerId);
        if (sacrificedPlayer && game.submissions[sacrificedPlayer.id]) {
            sacrificedPlayer.alive = false;

            const deathMessage = generateDeathMessage(
                sacrificedPlayer.name,
                game.submissions[sacrificedPlayer.id].text,
                game.submissions[sacrificedPlayer.id].item
            );

            const continuationStory = generateContinuationStory(
                game.players.filter(p => p.alive),
                sacrificedPlayer,
                game.currentStory
            );

            game.phase = 'result';

            safeEmit(game, 'player-sacrificed', {
                player: sacrificedPlayer,
                message: deathMessage,
                continuation: continuationStory
            });

            // Check remaining players BEFORE starting timer
            const remainingPlayers = game.players.filter(p => p.alive);
            console.log(`[GAME ${game.id}] Remaining players after sacrifice: ${remainingPlayers.length}`);

            if (remainingPlayers.length > 1) {
                debug.logPhase(game, 'Continuing to next round');
                game.timer = setTimeout(() => {
                    if (game.phase === 'ended') return;
                    startGame(game);
                }, 15000);
            } else if (remainingPlayers.length === 1) {
                debug.logPhase(game, 'Game has a winner, ending game immediately');
                const winner = remainingPlayers[0];
                const finalStory = generateFinalStoryEnding(winner, game);
                const fullRecap = generateFullStoryRecap(game);

                cleanupGame(game);
                safeEmit(game, 'game-winner', {
                    winner: winner,
                    story: finalStory,
                    recap: fullRecap
                });
            } else {
                debug.logPhase(game, 'Game ended in draw');
                cleanupGame(game);
                const fullRecap = generateFullStoryRecap(game);

                safeEmit(game, 'game-draw', {
                    message: "In a stunning turn of events, everyone managed to eliminate themselves!",
                    recap: fullRecap
                });
            }
        }
    }

    function handleCreateGame(socket, playerName) {
        const game = createGame(socket.id);
        const player = { id: socket.id, name: playerName, alive: true, voted: false };
        game.players.push(player);
        socket.join(game.id);
        socket.emit('game-created', { gameCode: game.id, player });
        safeEmit(game, 'game-state-update', game);
    }

    function handleJoinGame(socket, data) {
        const game = games.get(data.gameCode);
        if (!game) return socket.emit('error', 'Game not found!');
        const player = { id: socket.id, name: data.playerName, alive: true, voted: false };
        game.players.push(player);
        socket.join(game.id);
        socket.emit('player-joined', player);
        safeEmit(game, 'game-state-update', game);
    }

    function handleStartGame(socket) {
        const game = findGameBySocket(socket.id);
        if (!game) return;
        if (game.host === socket.id && game.players.length >= 2) startGame(game);
    }

    function handleSubmitAction(socket, data) {
        const game = findGameBySocket(socket.id);
        if (!game || game.phase !== 'submit') return;
        const player = game.players.find(p => p.id === socket.id);
        if (player) game.submissions[socket.id] = { text: data.action, item: player.currentItem };
        safeEmit(game, 'player-submitted', { submittedCount: Object.keys(game.submissions).length });
        if (Object.keys(game.submissions).length === game.players.filter(p => p.alive).length) showStoryResolution(game);
    }

    function handleSubmitVote(socket, votedId) {
        const game = findGameBySocket(socket.id);
        if (!game || game.phase !== 'vote') return;
        game.votes[socket.id] = votedId;
        const voter = game.players.find(p => p.id === socket.id); if (voter) voter.voted = true;
        socket.emit('vote-confirmed', votedId);
        safeEmit(game, 'vote-update', countVotes(game.votes));
        if (game.players.filter(p => p.alive).every(p => p.voted)) endVoting(game);
    }

    function handleDisconnect(socket) {
        for (const [code, game] of games) {
            const player = game.players.find(p => p.id === socket.id);
            if (!player) continue;
            game.players = game.players.filter(p => p.id !== socket.id);
            if (game.host === socket.id && game.players.length) {
                game.host = game.players[0].id;
                safeEmit(game, 'new-host', game.host);
            }
            safeEmit(game, 'player-disconnected', { player: player.name, message: generateDisconnectMessage(player.name) });
            safeEmit(game, 'game-state-update', game);
            if (game.players.filter(p => p.alive).length < 2 && game.phase !== 'waiting' && game.phase !== 'ended') {
                game.phase = 'ended';
                safeEmit(game, 'game-ended', 'Not enough players to continue');
            }
            if (!game.players.length) games.delete(code);
        }
    }

    return { handleCreateGame, handleJoinGame, handleStartGame, handleSubmitAction, handleSubmitVote, handleDisconnect };
}

module.exports = { initGameManager };
// gameManager.js (SERVER-SIDE)
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

const debug = {
    logPhase: (game, message = '') => {
        console.log(`[GAME ${game.id}] Phase: ${game.phase}, Round: ${game.roundNumber}, Players: ${game.players.filter(p => p.alive).length} alive - ${message}`);
    },
    logVotes: (game) => {
        const voteCounts = countVotes(game.votes);
        console.log(`[GAME ${game.id}] Votes:`, voteCounts);
    },
    logSubmissions: (game) => {
        console.log(`[GAME ${game.id}] Submissions:`, Object.keys(game.submissions).length, 'of', game.players.filter(p => p.alive).length);
    }
};

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function countVotes(votes) {
    const counts = {};
    Object.values(votes).forEach(votedId => {
        counts[votedId] = (counts[votedId] || 0) + 1;
    });
    return counts;
}

function initGameManager(io) {
    const games = new Map();

    function safeEmit(game, event, data) {
        if (game.phase === 'ended') {
            console.log(`[GAME ${game.id}] Ignored emit '${event}' (game already ended)`);
            return;
        }
        io.to(game.id).emit(event, data);
    }

    function cleanupGame(game) {
        if (game.timer) {
            clearTimeout(game.timer);
            game.timer = null;
        }
        game.phase = 'ended';
    }

    function createGame(hostId) {
        const gameCode = uuidv4().substring(0, 6).toUpperCase();
        const game = {
            id: gameCode,
            host: hostId,
            players: [],
            currentStory: null,
            storyIntroduction: "",
            submissions: {},
            votes: {},
            phase: 'waiting',
            timer: null,
            availableItems: [],
            roundNumber: 0
        };
        games.set(gameCode, game);
        return game;
    }

    function findGameBySocket(socketId) {
        for (const [gameCode, game] of games) {
            if (game.players.some(player => player.id === socketId)) {
                return game;
            }
        }
        return null;
    }

    function startGame(game) {
        if (game.phase === 'ended') {
            console.log(`[GAME ${game.id}] Game already ended, cannot start`);
            return;
        }

        game.phase = 'story';
        game.roundNumber++;
        debug.logPhase(game, 'New round started');

        if (game.roundNumber === 1) {
            const story = getRandomStory();
            game.currentStory = story;
            game.storyIntroduction = story.intro.replace('{players}', generatePlayerList(game.players));
        } else {
            game.currentStory.crisis = generateNewCrisis(game.currentStory, game.roundNumber);
        }

        game.availableItems = [...game.currentStory.items];
        shuffleArray(game.availableItems);

        game.players.forEach(player => {
            if (player.alive) {
                if (game.availableItems.length > 0) {
                    player.currentItem = game.availableItems.pop();
                } else {
                    player.currentItem = game.currentStory.items[
                        Math.floor(Math.random() * game.currentStory.items.length)
                    ];
                }
            }
        });

        game.submissions = {};
        game.votes = {};

        game.players.forEach(player => {
            player.voted = false;
        });

        game.players.forEach(player => {
            if (player.alive) {
                io.to(player.id).emit('new-story', {
                    introduction: game.roundNumber === 1 ? game.storyIntroduction : null,
                    scenario: game.currentStory.scenario,
                    crisis: game.currentStory.crisis,
                    playerItem: player.currentItem,
                    roundNumber: game.roundNumber
                });
            }
        });

        game.timer = setTimeout(() => {
            if (game.phase === 'ended') return;
            game.phase = 'submit';
            safeEmit(game, 'phase-change', 'submit');

            game.timer = setTimeout(() => {
                if (game.phase === 'ended') return;
                showStoryResolution(game);
            }, 60000);
        }, 20000);
    }

    function showStoryResolution(game) {
        if (game.phase === 'ended') {
            console.log(`[GAME ${game.id}] Game ended, skipping story resolution`);
            return;
        }

        debug.logPhase(game, 'Showing story resolution');
        game.phase = 'story-resolution';

        const submissionsForResolution = {};
        Object.keys(game.submissions).forEach((playerId) => {
            const player = game.players.find(p => p.id === playerId);
            if (player && game.submissions[playerId]) {
                submissionsForResolution[playerId] = {
                    text: game.submissions[playerId].text,
                    item: game.submissions[playerId].item,
                    playerName: player.name
                };
            }
        });

        const sillyResolution = generateSillyResolution(submissionsForResolution, game.currentStory.crisis);

        safeEmit(game, 'story-resolution', {
            submissions: submissionsForResolution,
            resolution: sillyResolution
        });

        game.timer = setTimeout(() => {
            if (game.phase === 'ended') return;
            debug.logPhase(game, 'Moving to voting after resolution');
            startVoting(game);
        }, 15000);
    }

    function startVoting(game) {
        debug.logPhase(game, 'Attempting to start voting');
        if (game.phase === 'ended') {
            console.log(`[GAME ${game.id}] Game ended, skipping voting`);
            return;
        }

        clearTimeout(game.timer);
        game.phase = 'vote';
        debug.logPhase(game, 'Voting started');

        game.players.forEach(player => {
            player.voted = false;
        });

        safeEmit(game, 'phase-change', 'vote');

        const votingPrompt = "All team members contributed... but let's be honest, some plans were better than others. Who should we leave behind for the team's survival?";

        const submissionsForVoting = {};
        Object.keys(game.submissions).forEach((playerId) => {
            const player = game.players.find(p => p.id === playerId);
            if (player && game.submissions[playerId]) {
                submissionsForVoting[playerId] = {
                    text: game.submissions[playerId].text,
                    item: game.submissions[playerId].item,
                    playerName: player.name
                };
            }
        });

        safeEmit(game, 'submissions-to-vote-on', {
            prompt: votingPrompt,
            submissions: submissionsForVoting
        });

        game.timer = setTimeout(() => {
            if (game.phase === 'ended') return;
            endVoting(game);
        }, 45000);
    }

    function endVoting(game) {
        debug.logPhase(game, 'Ending voting');
        clearTimeout(game.timer);

        const voteCounts = countVotes(game.votes);
        debug.logVotes(game);

        let maxVotes = 0;
        let sacrificedPlayerId = null;

        for (const [playerId, votes] of Object.entries(voteCounts)) {
            if (votes > maxVotes) {
                maxVotes = votes;
                sacrificedPlayerId = playerId;
            }
        }

        const tiedPlayers = Object.entries(voteCounts)
            .filter(([_, votes]) => votes === maxVotes)
            .map(([playerId, _]) => playerId);

        if (tiedPlayers.length > 1) {
            sacrificedPlayerId = tiedPlayers[Math.floor(Math.random() * tiedPlayers.length)];
        }

        const sacrificedPlayer = game.players.find(p => p.id === sacrificedPlayerId);
        if (sacrificedPlayer && game.submissions[sacrificedPlayer.id]) {
            sacrificedPlayer.alive = false;

            const deathMessage = generateDeathMessage(
                sacrificedPlayer.name,
                game.submissions[sacrificedPlayer.id].text,
                game.submissions[sacrificedPlayer.id].item
            );

            const continuationStory = generateContinuationStory(
                game.players.filter(p => p.alive),
                sacrificedPlayer,
                game.currentStory
            );

            game.phase = 'result';

            safeEmit(game, 'player-sacrificed', {
                player: sacrificedPlayer,
                message: deathMessage,
                continuation: continuationStory
            });

            game.timer = setTimeout(() => {
                if (game.phase === 'ended') return;

                const remainingPlayers = game.players.filter(p => p.alive);
                console.log(`[GAME ${game.id}] Remaining players: ${remainingPlayers.length}`);

                if (remainingPlayers.length > 1) {
                    debug.logPhase(game, 'Continuing to next round');
                    startGame(game);
                } else if (remainingPlayers.length === 1) {
                    debug.logPhase(game, 'Game has a winner, ending game');
                    const winner = remainingPlayers[0];
                    const finalStory = generateFinalStoryEnding(winner, game);
                    const fullRecap = generateFullStoryRecap(game);

                    cleanupGame(game);
                    safeEmit(game, 'game-winner', {
                        winner: winner,
                        story: finalStory,
                        recap: fullRecap
                    });

                    setTimeout(() => {
                        games.delete(game.id);
                        console.log(`[GAME ${game.id}] Removed from active games`);
                    }, 30000);
                } else {
                    debug.logPhase(game, 'Game ended in draw');
                    cleanupGame(game);
                    const fullRecap = generateFullStoryRecap(game);

                    safeEmit(game, 'game-draw', {
                        message: "In a stunning turn of events, everyone managed to eliminate themselves!",
                        recap: fullRecap
                    });

                    setTimeout(() => {
                        games.delete(game.id);
                        console.log(`[GAME ${game.id}] Removed from active games (draw)`);
                    }, 30000);
                }
            }, 15000);
        }
    }

    function handleCreateGame(socket, playerName) {
        const game = createGame(socket.id);
        const newPlayer = {
            id: socket.id,
            name: playerName,
            alive: true,
            voted: false
        };
        game.players.push(newPlayer);
        socket.join(game.id);
        socket.emit('game-created', { gameCode: game.id, player: newPlayer });
        safeEmit(game, 'game-state-update', game);
    }

    function handleJoinGame(socket, data) {
        const { gameCode, playerName } = data;
        const game = games.get(gameCode);

        if (game) {
            const newPlayer = {
                id: socket.id,
                name: playerName,
                alive: true,
                voted: false
            };
            game.players.push(newPlayer);
            socket.join(game.id);
            socket.emit('player-joined', newPlayer);
            safeEmit(game, 'game-state-update', game);
        } else {
            socket.emit('error', 'Game not found!');
        }
    }

    function handleStartGame(socket) {
        const game = findGameBySocket(socket.id);
        if (game && game.host === socket.id && game.players.length >= 2) {
            startGame(game);
        }
    }

    function handleSubmitAction(socket, data) {
        const game = findGameBySocket(socket.id);
        if (game && game.phase === 'submit') {
            const player = game.players.find(p => p.id === socket.id);
            if (player) {
                game.submissions[socket.id] = {
                    text: data.action,
                    item: player.currentItem
                };
            }

            safeEmit(game, 'player-submitted', {
                submittedCount: Object.keys(game.submissions).length
            });

            const alivePlayers = game.players.filter(p => p.alive);
            if (Object.keys(game.submissions).length === alivePlayers.length) {
                showStoryResolution(game);
            }
        }
    }

    function checkAllPlayersVoted(game) {
        const alivePlayers = game.players.filter(p => p.alive);
        const votedPlayers = alivePlayers.filter(p => p.voted);
        return votedPlayers.length === alivePlayers.length;
    }

    function handleSubmitVote(socket, votedPlayerId) {
        const game = findGameBySocket(socket.id);
        if (game && game.phase === 'vote') {
            game.votes[socket.id] = votedPlayerId;

            const voter = game.players.find(p => p.id === socket.id);
            if (voter) voter.voted = true;

            socket.emit('vote-confirmed', votedPlayerId);

            const voteCounts = countVotes(game.votes);
            safeEmit(game, 'vote-update', voteCounts);

            if (checkAllPlayersVoted(game)) {
                clearTimeout(game.timer);
                endVoting(game);
            }
        }
    }

    function handleDisconnect(socket) {
        for (const [gameCode, game] of games) {
            const player = game.players.find(p => p.id === socket.id);
            if (player) {
                const disconnectMessage = generateDisconnectMessage(player.name);
                game.players = game.players.filter(p => p.id !== socket.id);

                if (game.host === socket.id && game.players.length > 0) {
                    game.host = game.players[0].id;
                    safeEmit(game, 'new-host', game.players[0].id);
                }

                safeEmit(game, 'player-disconnected', {
                    player: player.name,
                    message: disconnectMessage
                });
                safeEmit(game, 'game-state-update', game);

                const alivePlayers = game.players.filter(p => p.alive);
                if (alivePlayers.length < 2 && game.phase !== 'waiting' && game.phase !== 'ended') {
                    game.phase = 'ended';
                    safeEmit(game, 'game-ended', 'Not enough players to continue');
                }

                if (game.players.length === 0) {
                    games.delete(gameCode);
                }
            }
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