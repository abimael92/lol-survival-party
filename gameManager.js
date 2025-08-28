// gameManager.js
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

// Add at the top of gameManager.js
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

// Helper function to shuffle array (Fisher-Yates algorithm)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Helper function to count votes
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


    // Add this function to gameManager.js
    function cleanupGame(game) {
        if (game.timer) {
            clearTimeout(game.timer);
            game.timer = null;
        }
        game.phase = 'ended';   // <-- flag it as ended
    }

    // Create game function
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

    // Find game by socket ID
    function findGameBySocket(socketId) {
        for (const [gameCode, game] of games) {
            if (game.players.some(player => player.id === socketId)) {
                return game;
            }
        }
        return null;
    }

    // Start game function
    function startGame(game) {

        // Don't start game if it has already ended
        if (game.phase === 'ended') {
            console.log(`[GAME ${game.id}] Game already ended, cannot start`);
            return;
        }

        game.phase = 'story';
        game.roundNumber++;
        debug.logPhase(game, 'New round started');

        // Get a random story for first round
        if (game.roundNumber === 1) {
            const story = getRandomStory();
            game.currentStory = story;
            game.storyIntroduction = story.intro.replace('{players}', generatePlayerList(game.players));
        } else {
            // For subsequent rounds, generate a new crisis
            game.currentStory.crisis = generateNewCrisis(game.currentStory, game.roundNumber);
        }

        // Reset and shuffle available items for this round
        game.availableItems = [...game.currentStory.items];
        shuffleArray(game.availableItems);

        // Assign a unique item to each alive player
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

        // Reset voted status for all players
        game.players.forEach(player => {
            player.voted = false;
        });

        // Send the story to each player with their specific item
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

        // After time for reading, move to submission phase
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

    // Show story resolution before voting
    function showStoryResolution(game) {

        if (game.phase === 'ended') {
            console.log(`[GAME ${game.id}] Game ended, skipping story resolution`);
            return;
        }

        debug.logPhase(game, 'Showing story resolution');
        game.phase = 'story-resolution';

        // Prepare submissions for resolution display
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

        // Generate a silly resolution for the crisis
        const sillyResolution = generateSillyResolution(submissionsForResolution, game.currentStory.crisis);

        // Send resolution to all players
        safeEmit(game, 'story-resolution', {
            submissions: submissionsForResolution,
            resolution: sillyResolution
        });

        // After showing resolution, move to voting
        game.timer = setTimeout(() => {
            if (game.phase === 'ended') return;

            debug.logPhase(game, 'Moving to voting after resolution');
            startVoting(game);
        }, 15000);
    }

    function startVoting(game) {
        debug.logPhase(game, 'Attempting to start voting');

        // Don't start game if it has already ended
        if (game.phase === 'ended') {
            console.log(`[GAME ${game.id}] Game ended, skipping voting`);
            return;
        }

        clearTimeout(game.timer);
        game.phase = 'vote';
        debug.logPhase(game, 'Voting started');

        // Reset voted status for all players
        game.players.forEach(player => {
            player.voted = false;
        });

        safeEmit(game, 'phase-change', 'vote');

        // Prepare voting prompt
        const votingPrompt = "All team members contributed... but let's be honest, some plans were better than others. Who should we leave behind for the team's survival?";

        // Prepare submissions for voting
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

        // Set timer for voting
        game.timer = setTimeout(() => {
            if (game.phase === 'ended') return;

            endVoting(game);
        }, 45000);
    }

    function endVoting(game) {
        debug.logPhase(game, 'Ending voting');
        clearTimeout(game.timer);
        const voteCounts = countVotes(game.votes);
        let maxVotes = 0;
        let sacrificedPlayerId = null;

        for (const [playerId, votes] of Object.entries(voteCounts)) {
            if (votes > maxVotes) {
                maxVotes = votes;
                sacrificedPlayerId = playerId;
            }
        }

        // handle ties randomly
        const tied = Object.entries(voteCounts).filter(([_, v]) => v === maxVotes).map(([p]) => p);
        if (tied.length > 1) sacrificedPlayerId = tied[Math.floor(Math.random() * tied.length)];

        const sacrificed = game.players.find(p => p.id === sacrificedPlayerId);
        if (!sacrificed) return;

        sacrificed.alive = false;

        const deathMessage = generateDeathMessage(sacrificed.name, game.submissions[sacrificed.id].text, game.submissions[sacrificed.id].item);
        const continuationStory = generateContinuationStory(game.players.filter(p => p.alive), sacrificed, game.currentStory);

        game.phase = 'result';
        safeEmit(game, 'player-sacrificed', { player: sacrificed, message: deathMessage, continuation: continuationStory });

        // ✅ single timer to go to next phase
        game.timer = setTimeout(() => {
            const alive = game.players.filter(p => p.alive);
            if (alive.length > 1) startGame(game);           // next round
            else if (alive.length === 1) {                    // winner
                const winner = alive[0];
                safeEmit(game, 'game-winner', { winner, story: generateFinalStoryEnding(winner, game), recap: generateFullStoryRecap(game) });
                cleanupGame(game);
            } else {                                         // draw
                safeEmit(game, 'game-draw', { message: 'Everyone eliminated!', recap: generateFullStoryRecap(game) });
                cleanupGame(game);
            }
        }, 15000); // 15s result display
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
                // Store both the action and the item used
                game.submissions[socket.id] = {
                    text: data.action,
                    item: player.currentItem
                };
            }

            // Notify all players about the submission
            safeEmit(game, 'player-submitted', {
                submittedCount: Object.keys(game.submissions).length
            });

            // Check if all alive players have submitted
            const alivePlayers = game.players.filter(p => p.alive);
            if (Object.keys(game.submissions).length === alivePlayers.length) {
                // Show story resolution before voting
                showStoryResolution(game);
            }
        }
    }

    // Add this function to check if all alive players have voted
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

            // Send vote confirmation to voter
            socket.emit('vote-confirmed', votedPlayerId);

            // Send updated vote counts to everyone
            const voteCounts = countVotes(game.votes);
            safeEmit(game, 'vote-update', voteCounts);

            // Check if all alive players have voted
            if (checkAllPlayersVoted(game)) {
                // All players have voted, end voting immediately
                clearTimeout(game.timer); // Clear the voting timer
                endVoting(game);
            }
        }
    }

    function handleDisconnect(socket) {
        // Find all games this socket was in
        for (const [gameCode, game] of games) {
            const player = game.players.find(p => p.id === socket.id);
            if (player) {
                const disconnectMessage = generateDisconnectMessage(player.name);
                game.players = game.players.filter(p => p.id !== socket.id);

                // If host left, assign new host
                if (game.host === socket.id && game.players.length > 0) {
                    game.host = game.players[0].id;
                    safeEmit(game, 'new-host', game.players[0].id);
                }

                safeEmit(game, 'player-disconnected', {
                    player: player.name,
                    message: disconnectMessage
                });
                safeEmit(game, 'game-state-update', game);

                // End game if not enough players
                const alivePlayers = game.players.filter(p => p.alive);
                if (alivePlayers.length < 2 && game.phase !== 'waiting' && game.phase !== 'ended') {
                    game.phase = 'ended';
                    safeEmit(game, 'game-ended', 'Not enough players to continue');
                }

                // Remove empty games
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