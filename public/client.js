const socket = io();
let playerId = null;

// DOM elements
const screens = {
    welcome: document.getElementById('welcome-screen'),
    story: document.getElementById('story-screen'),
    submit: document.getElementById('submit-screen'),
    vote: document.getElementById('vote-screen'),
    result: document.getElementById('result-screen'),
    winner: document.getElementById('winner-screen')
};

// Show only the specified screen
function showScreen(screenName) {
    Object.values(screens).forEach(screen => {
        screen.classList.remove('active');
    });
    screens[screenName].classList.add('active');
}

// Join game
document.getElementById('join-btn').addEventListener('click', () => {
    const playerName = document.getElementById('player-name').value.trim();
    if (playerName) {
        socket.emit('join-game', playerName);
    }
});

// Submit action
document.getElementById('submit-action').addEventListener('click', () => {
    const action = document.getElementById('action-input').value.trim();
    if (action) {
        socket.emit('submit-action', { action });
    }
});

// Play again
document.getElementById('play-again').addEventListener('click', () => {
    location.reload();
});

// Generate game link
document.getElementById('game-link').textContent = window.location.href;

// Socket event handlers
socket.on('player-joined', (player) => {
    playerId = player.id;
    document.getElementById('player-name').disabled = true;
    document.getElementById('join-btn').disabled = true;
});

socket.on('game-state-update', (gameState) => {
    const playersList = document.getElementById('players');
    playersList.innerHTML = '';

    gameState.players.forEach(player => {
        const li = document.createElement('li');
        li.textContent = `${player.name} ${player.alive ? '✅' : '💀'}`;
        playersList.appendChild(li);
    });
});

socket.on('new-story', (story) => {
    document.getElementById('story-scenario').textContent = story.scenario;
    document.getElementById('story-crisis').textContent = story.crisis;
    document.getElementById('story-item').textContent = `Item: ${story.item}`;
    showScreen('story');
});

socket.on('phase-change', (phase) => {
    if (phase === 'submit') {
        showScreen('submit');
        startTimer(60, () => {
            // Time's up logic handled by server
        });
    } else if (phase === 'vote') {
        showScreen('vote');
        startTimer(45, () => {
            // Time's up logic handled by server
        });
    }
});

socket.on('submissions-to-vote-on', (submissions) => {
    const submissionsList = document.getElementById('submissions-list');
    submissionsList.innerHTML = '';

    for (const [playerId, action] of Object.entries(submissions)) {
        const div = document.createElement('div');
        div.className = 'submission-item';
        div.textContent = action;
        div.addEventListener('click', () => {
            socket.emit('submit-vote', playerId);
        });
        submissionsList.appendChild(div);
    }
});

socket.on('player-sacrificed', (data) => {
    document.getElementById('sacrifice-message').textContent = data.message;
    showScreen('result');
});

socket.on('game-winner', (winner) => {
    document.getElementById('winner-message').textContent =
        `${winner.name} is the last one standing and wins the game!`;
    showScreen('winner');
});

// Timer function
function startTimer(duration, callback) {
    let time = duration;
    const timerElement = document.getElementById('time');

    const countdown = setInterval(() => {
        timerElement.textContent = time;
        time--;

        if (time < 0) {
            clearInterval(countdown);
            if (callback) callback();
        }
    }, 1000);
}