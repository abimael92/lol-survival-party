const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files
app.use(express.static('public'));

// Store multiple game sessions
const games = new Map();

// Predefined stories with more variety
const stories = [
    {
        intro: "It was a perfectly normal day when {players} decided to go on an adventure together. Little did they know, their outing would take a bizarre turn...",
        scenario: "You find yourselves trapped in a vampire's mansion! The vampire is allergic to silly things, and various items slide out of a secret passage.",
        crisis: "The vampire is getting hungry! How do you use your item to buy more time?",
        items: ["rubber chicken", "whoopee cushion", "giant foam finger", "kazoo", "silly putty", "joy buzzer", "rainbow wig", "oversized sunglasses"]
    },
    {
        intro: "{players} were just minding their own business when suddenly, adventure found them!",
        scenario: "You're being chased by a zombie horde through a shopping mall! You find a room full of unusual items.",
        crisis: "The zombies are closing in! How do you use your item to survive?",
        items: ["tennis racket", "roll of duct tape", "whoopee cushion", "rubber chicken", "super soaker", "fidget spinner", "yo-yo", "whoopee cushion"]
    },
    {
        intro: "What started as a normal day for {players} quickly spiraled into chaos...",
        scenario: "You wake up on a spaceship with a hostile alien! The only unusual items in the room are various novelty items.",
        crisis: "The alien is about to break through the door! How do you use your item to stop it?",
        items: ["whoopee cushion", "rubber chicken", "joy buzzer", "fake mustache", "rainbow wig", "giant foam finger", "kazoo", "silly string"]
    },
    {
        intro: "{players} were enjoying a peaceful picnic when suddenly...",
        scenario: "A giant mutant squirrel army is attacking the city! You find yourselves in a novelty shop with strange items.",
        crisis: "The squirrels are organizing into formation! How do you use your item to disrupt their plans?",
        items: ["squeaky toy", "bubble wand", "slinky", "magnifying glass", "whoopee cushion", "fake dog poop", "air horn", "groucho marx glasses"]
    },
    {
        intro: "During a routine office meeting, {players} suddenly found themselves in an unexpected situation...",
        scenario: "You've been transported to a dimension where everything is made of pudding! The only weapons are office supplies with strange properties.",
        crisis: "The pudding monsters are starting to melt together into a giant blob! How do you use your item to stop them?",
        items: ["stapler", "paperclip necklace", "coffee mug", "stress ball", "rubber band ball", "post-it notes", "whiteboard marker", "desktop zen garden"]
    }
];

// Get random story
function getRandomStory() {
    return stories[Math.floor(Math.random() * stories.length)];
}

// Generate player list string
function generatePlayerList(players) {
    const names = players.map(p => p.name);
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} and ${names[1]}`;
    return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

// Generate silly resolution for the crisis based on player actions
function generateSillyResolution(submissions, crisis) {
    const actions = Object.values(submissions).map(sub =>
        `${sub.playerName} used ${sub.item} to ${sub.text}`
    );

    const resolutions = [
        `In a stunning display of teamwork (or lack thereof), ${actions.join(', ')}. The combined effect was so absurd that it actually worked! The crisis was averted through the power of sheer ridiculousness.`,
        `Through a series of increasingly bizarre events: ${actions.join(', ')}. Miraculously, this chaotic combination somehow resolved the ${crisis.toLowerCase()}!`,
        `What followed can only be described as organized chaos: ${actions.join(', ')}. Against all odds, this ridiculous plan actually worked!`,
        `In a moment of pure insanity: ${actions.join(', ')}. Somehow, this combination of terrible ideas created a perfect solution to the ${crisis.toLowerCase()}!`,
        `Through a comedy of errors that would make a clown proud: ${actions.join(', ')}. Astonishingly, this series of mishaps somehow resolved the situation!`
    ];

    return resolutions[Math.floor(Math.random() * resolutions.length)];
}

// Generate funny death message
function generateDeathMessage(playerName, submission, item) {
    const deaths = [
        `${playerName} tried to use the ${item} to ${submission}. It was so embarrassing that everyone decided it was better to continue without them.`,
        `${playerName}'s idea to ${submission} with the ${item} backfired spectacularly. The group voted unanimously to leave them behind.`,
        `When ${playerName} attempted to ${submission}, it confused everyone so much that the group decided they were better off without that kind of "help."`,
        `${playerName}'s plan to ${submission} was so bad the group decided some risks weren't worth taking. They were left behind for everyone's safety.`,
        `The ${item} seemed like a good idea to ${playerName}, but their attempt to ${submission} resulted in the group making a quick unanimous decision to continue without them.`,
        `${playerName} used the ${item} to ${submission} with such enthusiasm that they accidentally volunteered themselves as the sacrifice.`,
        `After ${playerName}'s attempt to ${submission} with the ${item}, the group decided they were clearly too powerful to keep around and had to be left behind for balance.`,
        `${playerName}'s ${submission} technique with the ${item} was so advanced that no one else could understand it. They were left behind for being too much of a genius.`
    ];
    return deaths[Math.floor(Math.random() * deaths.length)];
}

// Generate story continuation after sacrifice
function generateContinuationStory(remainingPlayers, sacrificedPlayer, currentStory) {
    const continuations = [
        `With ${sacrificedPlayer.name} now busy exploring alternative career options, ${generatePlayerList(remainingPlayers)} pressed on with the mission. Little did they know, a new challenge awaited...`,
        `The group made the tough but necessary decision to continue without ${sacrificedPlayer.name}. ${generatePlayerList(remainingPlayers)} took a deep breath and advanced to the next challenge.`,
        `As ${sacrificedPlayer.name} became distracted by something shiny, ${generatePlayerList(remainingPlayers)} seized the opportunity to move forward. The adventure continued!`,
        `${generatePlayerList(remainingPlayers)} gave a respectful nod to ${sacrificedPlayer.name} before continuing the adventure without them. The story wasn't over yet...`,
        `With ${sacrificedPlayer.name} now pursuing their true calling as a professional potato, ${generatePlayerList(remainingPlayers)} ventured forth into the next phase of their journey.`
    ];
    return continuations[Math.floor(Math.random() * continuations.length)];
}

// Generate new crisis for the next round
function generateNewCrisis(currentStory, roundNumber) {
    const crises = [
        "A new threat emerges! The situation has escalated dramatically. How do you use your item to handle this development?",
        "Just when you thought it was safe! Another problem arises that requires immediate attention. How do you use your item to address this?",
        "Plot twist! The circumstances have changed completely. How do you use your item to adapt to this new situation?",
        "Unexpected development! Things just got even more complicated. How do you use your item to navigate this turn of events?",
        "The stakes have been raised! A fresh challenge presents itself. How do you use your item to overcome this obstacle?",
        "Complication alert! The situation has evolved in unpredictable ways. How do you use your item to manage this new reality?",
        "Surprise! The adventure takes an unexpected turn. How do you use your item to deal with this revelation?",
        "The drama continues! A new crisis demands your attention. How do you use your item to resolve this issue?"
    ];

    return crises[Math.floor(Math.random() * crises.length)];
}

// Generate final story ending
function generateFinalStoryEnding(winner, game) {
    const stories = [
        `After a series of increasingly absurd challenges, ${winner.name} emerged victorious! Their clever use of various items throughout the adventure proved that sometimes the weirdest ideas are the most effective.`,
        `${winner.name} stood alone at the end, having outlasted everyone else through a combination of creativity and other people's terrible decisions. The adventure was complete!`,
        `In the final moments, ${winner.name}'s persistence paid off. While others fell to their own ridiculous plans, ${winner.name} managed to navigate the chaos and emerge as the winner.`,
        `Through luck, timing, and the strategic use of questionable items, ${winner.name} proved that surviving absurdity is its own form of victory.`,
        `${winner.name} triumphed! Not through strength or wisdom, but through the ancient art of being slightly less ridiculous than everyone else.`,
        `Against all odds, ${winner.name} emerged as the sole survivor of this comedy of errors. Their prize: bragging rights and probably some therapy.`
    ];
    return stories[Math.floor(Math.random() * stories.length)];
}

// Generate full story recap
function generateFullStoryRecap(game) {
    let recap = `COMPLETE ADVENTURE RECAP:\n\n`;
    recap += `Our story began: ${game.storyIntroduction}\n\n`;

    recap += `THE JOURNEY:\n`;
    game.players.forEach((player) => {
        if (game.submissions[player.id]) {
            if (player.alive) {
                recap += `- ${player.name} used ${player.currentItem} to ${game.submissions[player.id].text}\n`;
            } else {
                recap += `- ${player.name} used ${player.currentItem} to ${game.submissions[player.id].text} and was left behind\n`;
            }
        }
    });

    const winner = game.players.find(p => p.alive);
    if (winner) {
        recap += `\nFINAL OUTCOME: ${winner.name} emerged victorious!\n`;
    } else {
        recap += `\nEPILOGUE: Everyone was eliminated in this comedy of errors!\n`;
    }

    return recap;
}

// Generate funny disconnect messages
function generateDisconnectMessage(playerName) {
    const messages = [
        `${playerName} spontaneously combusted due to a lack of creativity.`,
        `${playerName} was abducted by aliens who needed better story ideas.`,
        `${playerName} tripped over their own imagination and fell out of reality.`,
        `${playerName} decided to become a professional hermit instead.`,
        `${playerName} was voted off the island of creativity.`,
        `${playerName} discovered the meaning of life and decided this game wasn't it.`,
        `${playerName} was called away on urgent business - something about a missing rubber chicken.`
    ];
    return messages[Math.floor(Math.random() * messages.length)];
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

// Helper function to count votes
function countVotes(game) {
    const counts = {};
    Object.values(game.votes).forEach(votedId => {
        counts[votedId] = (counts[votedId] || 0) + 1;
    });
    return counts;
}

// Helper function to shuffle array (Fisher-Yates algorithm)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Start game function
function startGame(game) {
    game.phase = 'story';
    game.roundNumber++;

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
        startVoting(game);
    }, 15000);
}

function startVoting(game) {
    clearTimeout(game.timer);
    game.phase = 'vote';
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
    clearTimeout(game.timer);

    // Calculate votes and eliminate player
    const voteCounts = countVotes(game);
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
            if (remainingPlayers.length > 1) {
                startGame(game);
            } else if (remainingPlayers.length === 1) {
                const winner = remainingPlayers[0];
                const finalStory = generateFinalStoryEnding(winner, game);
                const fullRecap = generateFullStoryRecap(game);

                game.phase = 'winner';
                io.to(game.id).emit('game-winner', {
                    winner: winner,
                    story: finalStory,
                    recap: fullRecap
                });
            } else {
                game.phase = 'draw';
                const fullRecap = generateFullStoryRecap(game);

                io.to(game.id).emit('game-draw', {
                    message: "In a stunning turn of events, everyone managed to eliminate themselves!",
                    recap: fullRecap
                });
            }
        }, 15000);
    }
}

// Socket connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('create-game', (playerName) => {
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
    });

    socket.on('join-game', (data) => {
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
    });

    socket.on('start-game', () => {
        const game = findGameBySocket(socket.id);
        if (game && game.host === socket.id && game.players.length >= 2) {
            startGame(game);
        }
    });

    // Handle player submission
    socket.on('submit-action', (data) => {
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
    });

    socket.on('submit-vote', (votedPlayerId) => {
        const game = findGameBySocket(socket.id);
        if (game && game.phase === 'vote') {
            game.votes[socket.id] = votedPlayerId;

            const voter = game.players.find(p => p.id === socket.id);
            if (voter) voter.voted = true;

            // Send vote confirmation to voter
            socket.emit('vote-confirmed', votedPlayerId);

            // Send updated vote counts to everyone
            const voteCounts = countVotes(game);
            io.to(game.id).emit('vote-update', voteCounts);

            // Check if all alive players have voted
            const alivePlayers = game.players.filter(p => p.alive);
            const votedPlayers = alivePlayers.filter(p => p.voted);

            if (votedPlayers.length === alivePlayers.length) {
                endVoting(game);
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);

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
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
});