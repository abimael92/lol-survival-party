const socket = io();
let playerId = null;
let currentGameCode = null;
let currentGameState = null;

// DOM elements
const screens = {
    welcome: document.getElementById('welcome-screen'),
    story: document.getElementById('story-screen'),
    submit: document.getElementById('submit-screen'),
    vote: document.getElementById('vote-screen'),
    result: document.getElementById('result-screen'),
    winner: document.getElementById('winner-screen')
};

// Timer elements
const timerElements = {
    story: document.getElementById('story-time'),
    submit: document.getElementById('submit-time'),
    vote: document.getElementById('vote-time'),
    result: document.getElementById('result-time')
};

// Show only the specified screen
function showScreen(screenName) {
    Object.values(screens).forEach(screen => {
        screen.classList.remove('active');
    });
    if (screens[screenName]) {
        screens[screenName].classList.add('active');
    }
}

// Start a timer with visual countdown
function startTimer(duration, elementId, callback) {
    let time = duration;
    const timerElement = document.getElementById(elementId);

    if (timerElement) {
        timerElement.textContent = time;
    }

    const countdown = setInterval(() => {
        time--;

        if (timerElement) {
            timerElement.textContent = time;
        }

        if (time <= 0) {
            clearInterval(countdown);
            if (callback) callback();
        }
    }, 1000);

    return countdown;
}

// Generate QR code function
function generateQRCode(url) {
    const qrContainer = document.getElementById('qr-code');
    if (!qrContainer) return;

    qrContainer.innerHTML = '';
    const qrImg = document.createElement('img');
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}`;
    qrContainer.appendChild(qrImg);
}

// Initialize the game
function initGame() {
    // Create game button
    const createBtn = document.getElementById('create-btn');
    if (createBtn) {
        createBtn.addEventListener('click', () => {
            const playerName = document.getElementById('player-name').value.trim();
            if (playerName) {
                socket.emit('create-game', playerName);
            } else {
                alert('Please enter your name');
            }
        });
    }

    // Join game button
    const joinBtn = document.getElementById('join-btn');
    if (joinBtn) {
        joinBtn.addEventListener('click', () => {
            const playerName = document.getElementById('player-name').value.trim();
            const gameCode = document.getElementById('game-code-input').value.trim().toUpperCase();
            if (playerName && gameCode) {
                currentGameCode = gameCode;
                socket.emit('join-game', { gameCode, playerName });
            } else {
                alert('Please enter your name and game code');
            }
        });
    }

    // Start game button (host only)
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            socket.emit('start-game');
        });
    }

    // Submit action button
    const submitActionBtn = document.getElementById('submit-action');
    if (submitActionBtn) {
        submitActionBtn.addEventListener('click', () => {
            const action = document.getElementById('action-input').value.trim();
            if (action) {
                socket.emit('submit-action', { action });
                submitActionBtn.disabled = true;
                document.getElementById('submission-status').textContent = 'Submitted! Waiting for others...';
            } else {
                alert('Please describe your action');
            }
        });
    }

    // Play again button
    const playAgainBtn = document.getElementById('play-again');
    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', () => {
            location.reload();
        });
    }

    // Share buttons
    const copyLinkBtn = document.getElementById('copy-link');
    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', () => {
            if (currentGameCode) {
                const gameLink = `${window.location.origin}${window.location.pathname}?game=${currentGameCode}`;
                navigator.clipboard.writeText(gameLink).then(() => {
                    alert('Game link copied to clipboard!');
                }).catch(() => {
                    alert('Failed to copy link. Please manually copy the URL.');
                });
            } else {
                alert('No game code available');
            }
        });
    }

    const shareQrBtn = document.getElementById('share-qr');
    if (shareQrBtn) {
        shareQrBtn.addEventListener('click', () => {
            if (currentGameCode) {
                const gameLink = `${window.location.origin}${window.location.pathname}?game=${currentGameCode}`;
                generateQRCode(gameLink);
            } else {
                alert('No game code available');
            }
        });
    }

    // Check for game code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const gameCodeFromUrl = urlParams.get('game');
    if (gameCodeFromUrl) {
        document.getElementById('game-code-input').value = gameCodeFromUrl;
    }

    // Set up voting functionality
    setupVoting();
}

// Set up voting functionality
function setupVoting() {
    document.addEventListener('click', (e) => {
        if (e.target.closest('.submission-item')) {
            const submissionItem = e.target.closest('.submission-item');
            const playerId = submissionItem.dataset.playerId;

            // Only allow voting if we're on the vote screen and haven't voted yet
            if (screens.vote.classList.contains('active') && !document.querySelector('.submission-item.voted')) {
                socket.emit('submit-vote', playerId);
            }
        }
    });
}

// Socket event handlers
socket.on('game-created', (data) => {
    currentGameCode = data.gameCode;
    playerId = data.player.id;

    document.getElementById('game-code-display').textContent = `Game Code: ${currentGameCode}`;
    document.getElementById('game-info').style.display = 'block';
    document.getElementById('player-list').style.display = 'block';
    document.getElementById('host-controls').style.display = 'block';
    document.getElementById('game-creation').style.display = 'none';

    // Add yourself to player list
    const playersList = document.getElementById('players');
    const li = document.createElement('li');
    li.textContent = `${data.player.name} (You) 🎮`;
    playersList.appendChild(li);
});

socket.on('player-joined', (player) => {
    playerId = player.id;

    document.getElementById('player-name').disabled = true;
    document.getElementById('game-code-input').disabled = true;
    document.querySelectorAll('button').forEach(btn => {
        if (btn.id !== 'start-btn' && btn.id !== 'copy-link' && btn.id !== 'share-qr') {
            btn.disabled = true;
        }
    });

    document.getElementById('game-info').style.display = 'block';
    document.getElementById('player-list').style.display = 'block';
});

socket.on('game-state-update', (gameState) => {
    currentGameState = gameState;
    const playersList = document.getElementById('players');
    playersList.innerHTML = '';

    gameState.players.forEach(player => {
        const li = document.createElement('li');
        li.textContent = `${player.name} ${player.id === playerId ? '(You) ' : ''}${player.alive ? '✅' : '💀'}`;
        if (player.id === gameState.host) {
            li.innerHTML += ' <span class="host-badge">HOST</span>';
        }
        playersList.appendChild(li);
    });
});

socket.on('new-story', (storyData) => {
    let storyHTML = '';

    // Show introduction only for first round
    if (storyData.introduction) {
        storyHTML += `<div class="story-intro">${storyData.introduction}</div>`;
    }

    // Add scenario and crisis
    storyHTML += `
        <div class="story-scenario">${storyData.scenario}</div>
        <div class="story-crisis">${storyData.crisis}</div>
        <div class="story-item">Your Item: <strong>${storyData.playerItem}</strong></div>
    `;

    document.getElementById('story-content').innerHTML = storyHTML;
    showScreen('story');
    startTimer(20, 'story-time', () => {
        // Timer completed, server will handle phase change
    });
});

socket.on('phase-change', (phase) => {
    if (phase === 'submit') {
        showScreen('submit');
        document.getElementById('action-input').value = '';
        document.getElementById('submit-action').disabled = false;
        document.getElementById('submission-status').textContent = '';

        startTimer(60, 'submit-time', () => {
            document.getElementById('submission-status').textContent = 'Time\'s up!';
        });
    } else if (phase === 'story-resolution') {
        // This is handled by the story-resolution event
    } else if (phase === 'vote') {
        showScreen('vote');
        startTimer(45, 'vote-time', () => {
            document.getElementById('vote-status').textContent = 'Time\'s up!';
        });
    }
});

// Story resolution showing all player actions and the silly resolution
socket.on('story-resolution', (data) => {
    let resolutionHTML = `<div class="resolution-title">How the crisis was resolved:</div>`;

    for (const [playerId, submission] of Object.entries(data.submissions)) {
        resolutionHTML += `
            <div class="player-resolution">
                <strong>${submission.playerName}</strong> used their <em>${submission.item}</em> to 
                ${submission.text}
            </div>
        `;
    }

    // Add the silly resolution from the server
    resolutionHTML += `<div class="silly-resolution">${data.resolution}</div>`;

    document.getElementById('story-content').innerHTML = resolutionHTML;
    showScreen('story');

    startTimer(15, 'story-time', () => {
        // Timer completed, server will handle next phase
    });
});

socket.on('player-submitted', (data) => {
    document.getElementById('submission-status').textContent = `${data.submittedCount || 'Some'} players have submitted...`;
});

socket.on('submissions-to-vote-on', (data) => {
    let votingHTML = `<div class="voting-prompt">${data.prompt}</div>`;

    votingHTML += `<div class="submissions-list">`;
    for (const [playerId, submission] of Object.entries(data.submissions)) {
        votingHTML += `
            <div class="submission-item" data-player-id="${playerId}">
                <div class="submission-text">"${submission.text}"</div>
                <div class="submission-details">- ${submission.playerName} using ${submission.item}</div>
                <div class="vote-count">Votes: 0</div>
            </div>
        `;
    }
    votingHTML += `</div>`;

    document.getElementById('voting-content').innerHTML = votingHTML;
    showScreen('vote');
    startTimer(45, 'vote-time', () => {
        document.getElementById('vote-status').textContent = 'Time\'s up!';
    });
});

socket.on('vote-confirmed', (votedId) => {
    document.getElementById('vote-status').textContent = 'Vote recorded!';

    document.querySelectorAll('.submission-item').forEach(item => {
        if (item.dataset.playerId === votedId) {
            item.classList.add('voted');
        }
    });
});

socket.on('vote-update', (voteCounts) => {
    document.querySelectorAll('.submission-item').forEach(item => {
        const playerId = item.dataset.playerId;
        const voteCount = voteCounts[playerId] || 0;
        const voteCountElement = item.querySelector('.vote-count');
        if (voteCountElement) {
            voteCountElement.textContent = `Votes: ${voteCount}`;
        }
    });
});

socket.on('player-sacrificed', (data) => {
    const resultHTML = `
        <div class="elimination-story">
            <h3>${data.player.name} has been left behind!</h3>
            <div class="elimination-reason">${data.message}</div>
            <div class="story-continuation">${data.continuation}</div>
        </div>
    `;

    document.getElementById('result-content').innerHTML = resultHTML;
    showScreen('result');
    startTimer(15, 'result-time', () => {
        // Timer completed, server will handle next phase
    });
});

socket.on('game-winner', (data) => {
    const winnerHTML = `
        <div class="final-chapter">
            <h2>THE SAGA CONCLUDES</h2>
            <div class="final-story">${data.story}</div>
        </div>
        <div class="full-recap">
            <h3>COMPLETE STORY</h3>
            <pre>${data.recap}</pre>
        </div>
    `;

    document.getElementById('winner-content').innerHTML = winnerHTML;
    showScreen('winner');
});

socket.on('game-draw', (data) => {
    const drawHTML = `
        <div class="final-chapter">
            <h2>AN UNEXPECTED CONCLUSION</h2>
            <div class="final-story">${data.message}</div>
        </div>
        <div class="full-recap">
            <h3>COMPLETE STORY</h3>
            <pre>${data.recap}</pre>
        </div>
    `;

    document.getElementById('winner-content').innerHTML = drawHTML;
    showScreen('winner');
});

socket.on('player-disconnected', (data) => {
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.background = 'rgba(233, 69, 96, 0.9)';
    notification.style.color = 'white';
    notification.style.padding = '10px';
    notification.style.borderRadius = '5px';
    notification.style.zIndex = '1000';
    notification.textContent = `${data.player} disconnected! ${data.message}`;

    document.body.appendChild(notification);

    setTimeout(() => {
        document.body.removeChild(notification);
    }, 5000);
});

socket.on('error', (message) => {
    alert(`Error: ${message}`);
});

socket.on('new-host', (hostId) => {
    if (hostId === playerId) {
        document.getElementById('host-controls').style.display = 'block';
        alert('You are now the host!');
    }
});

// Initialize the game when the document is loaded
document.addEventListener('DOMContentLoaded', initGame);