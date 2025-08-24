const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files
app.use(express.static('public'));

// Game state
let gameState = {
  players: [],
  currentStory: null,
  submissions: {},
  phase: 'waiting', // waiting, story, submit, vote, result
  timer: null
};

// Predefined stories
const stories = [
  {
    scenario: "You're all trapped in a vampire's mansion. He's allergic to silly things. A rubber chicken slides out of a secret passage.",
    item: "rubber chicken",
    crisis: "The vampire is getting hungry! How do you use the RUBBER CHICKEN to buy more time?"
  },
  {
    scenario: "You're being chased by a zombie horde through a shopping mall. You find a room full of tennis rackets.",
    item: "tennis racket",
    crisis: "The zombies are closing in! How do you use the TENNIS RACKET to survive?"
  },
  {
    scenario: "You're on a spaceship with a hostile alien. The only unusual item in the room is a whoopee cushion.",
    item: "whoopee cushion",
    crisis: "The alien is about to break through the door! How do you use the WHOOPEE CUSHION to stop it?"
  }
];

// Get random story
function getRandomStory() {
  return stories[Math.floor(Math.random() * stories.length)];
}

// Generate funny death message
function generateDeathMessage(playerName, submission, item) {
  const deaths = [
    `${playerName} tried to ${submission}. It was so embarrassing that the vampires died laughing... and then ${playerName} tripped and turned into a coat rack.`,
    `${playerName}'s idea to ${submission} backfired spectacularly. They're now serving as a warning to others.`,
    `When ${playerName} attempted to ${submission}, it confused everyone so much that reality itself shifted and erased them from existence.`,
    `${playerName}'s plan to ${submission} was so bad the universe awarded them a trophy for 'Worst Idea of the Century' and then disintegrated them.`
  ];
  return deaths[Math.floor(Math.random() * deaths.length)];
}

// Socket connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Add new player
  socket.on('join-game', (playerName) => {
    const newPlayer = {
      id: socket.id,
      name: playerName,
      alive: true
    };
    
    gameState.players.push(newPlayer);
    socket.emit('player-joined', newPlayer);
    io.emit('game-state-update', gameState);
    
    // Start game if enough players
    if (gameState.players.length >= 2 && gameState.phase === 'waiting') {
      startGame();
    }
  });
  
  // Handle player submission
  socket.on('submit-action', (data) => {
    gameState.submissions[socket.id] = data.action;
    
    // Check if all alive players have submitted
    const alivePlayers = gameState.players.filter(p => p.alive);
    if (Object.keys(gameState.submissions).length === alivePlayers.length) {
      startVoting();
    }
  });
  
  // Handle player vote
  socket.on('submit-vote', (votedPlayerId) => {
    // Record vote logic here
    // When all votes are in, calculate results
    // Then move to result phase
  });
  
  // Disconnect handling
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    gameState.players = gameState.players.filter(p => p.id !== socket.id);
    io.emit('game-state-update', gameState);
  });
});

function startGame() {
  gameState.phase = 'story';
  gameState.currentStory = getRandomStory();
  gameState.submissions = {};
  
  io.emit('new-story', gameState.currentStory);
  
  // After time for reading, move to submission phase
  setTimeout(() => {
    gameState.phase = 'submit';
    io.emit('phase-change', 'submit');
    
    // Set timer for submissions
    gameState.timer = setTimeout(() => {
      startVoting();
    }, 60000); // 60 seconds for submissions
  }, 10000); // 10 seconds for reading
}

function startVoting() {
  clearTimeout(gameState.timer);
  gameState.phase = 'vote';
  io.emit('phase-change', 'vote');
  io.emit('submissions-to-vote-on', gameState.submissions);
  
  // Set timer for voting
  gameState.timer = setTimeout(() => {
    endVoting();
  }, 45000); // 45 seconds for voting
}

function endVoting() {
  // Calculate votes and eliminate player
  // For now, randomly eliminate someone for demo purposes
  const alivePlayers = gameState.players.filter(p => p.alive);
  if (alivePlayers.length > 1) {
    const sacrificedPlayer = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
    sacrificedPlayer.alive = false;
    
    const deathMessage = generateDeathMessage(
      sacrificedPlayer.name, 
      gameState.submissions[sacrificedPlayer.id],
      gameState.currentStory.item
    );
    
    gameState.phase = 'result';
    io.emit('phase-change', 'result');
    io.emit('player-sacrificed', {player: sacrificedPlayer, message: deathMessage});
    
    // Check if game should continue
    setTimeout(() => {
      const remainingPlayers = gameState.players.filter(p => p.alive);
      if (remainingPlayers.length > 1) {
        startGame();
      } else if (remainingPlayers.length === 1) {
        gameState.phase = 'winner';
        io.emit('game-winner', remainingPlayers[0]);
      } else {
        gameState.phase = 'draw';
        io.emit('game-draw');
      }
    }, 10000); // Show result for 10 seconds
  }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});