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
        setTimeout(() => {
            game.phase = 'submit';
            io.to(game.id).emit('phase-change', 'submit');

            // Set timer for submissions
            game.timer = setTimeout(() => {
                showStoryResolution(game);
            }, 60000);
        }, 20000);
    }

    // Show story resolution before voting
    function showStoryResolution(game) {
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
        io.to(game.id).emit('story-resolution', {
            submissions: submissionsForResolution,
            resolution: sillyResolution
        });

        // After showing resolution, move to voting
        game.timer = setTimeout(() => {
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

        io.to(game.id).emit('phase-change', 'vote');

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

        io.to(game.id).emit('submissions-to-vote-on', {
            prompt: votingPrompt,
            submissions: submissionsForVoting
        });

        // Set timer for voting
        game.timer = setTimeout(() => {
            endVoting(game);
        }, 45000);
    }

    function endVoting(game) {
        debug.logPhase(game, 'Ending voting');
        clearTimeout(game.timer);

        // Calculate votes and eliminate player
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

        // If there's a tie, randomly select one
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

            // Send elimination result to all players
            io.to(game.id).emit('player-sacrificed', {
                player: sacrificedPlayer,
                message: deathMessage,
                continuation: continuationStory
            });

            // Check if game should continue
            game.timer = setTimeout(() => {
                const remainingPlayers = game.players.filter(p => p.alive);

                // Only continue if there are still multiple players alive
                if (remainingPlayers.length > 1) {
                    debug.logPhase(game, 'Continuing to next round');
                    startGame(game);
                }
                // If only one player remains, end the game
                else if (remainingPlayers.length === 1) {
                    debug.logPhase(game, 'Game has a winner, ending game');
                    const winner = remainingPlayers[0];
                    const finalStory = generateFinalStoryEnding(winner, game);
                    const fullRecap = generateFullStoryRecap(game);

                    game.phase = 'ended'; // Set phase to ended to prevent further gameplay
                    debug.logPhase(game, 'Game ended with winner');

                    io.to(game.id).emit('game-winner', {
                        winner: winner,
                        story: finalStory,
                        recap: fullRecap
                    });

                    // Remove the game from active games after a delay
                    setTimeout(() => {
                        games.delete(game.id);
                    }, 30000); // Remove after 30 seconds
                }
                // If no players remain (draw)
                else {
                    debug.logPhase(game, 'Game ended in draw');
                    game.phase = 'ended'; // Set phase to ended
                    const fullRecap = generateFullStoryRecap(game);

                    io.to(game.id).emit('game-draw', {
                        message: "In a stunning turn of events, everyone managed to eliminate themselves!",
                        recap: fullRecap
                    });

                    // Remove the game from active games after a delay
                    setTimeout(() => {
                        games.delete(game.id);
                    }, 30000); // Remove after 30 seconds
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
        io.to(game.id).emit('game-state-update', game);
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
            io.to(game.id).emit('game-state-update', game);
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
            io.to(game.id).emit('player-submitted', {
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
            io.to(game.id).emit('vote-update', voteCounts);

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
                    io.to(game.id).emit('new-host', game.players[0].id);
                }

                io.to(game.id).emit('player-disconnected', {
                    player: player.name,
                    message: disconnectMessage
                });
                io.to(game.id).emit('game-state-update', game);

                // End game if not enough players
                const alivePlayers = game.players.filter(p => p.alive);
                if (alivePlayers.length < 2 && game.phase !== 'waiting' && game.phase !== 'ended') {
                    game.phase = 'ended';
                    io.to(game.id).emit('game-ended', 'Not enough players to continue');
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