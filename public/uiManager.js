// uiManager.js
export function initUIManager() {
    // DOM elements
    const screens = {
        welcome: document.getElementById('welcome-screen'),
        story: document.getElementById('story-screen'),
        submit: document.getElementById('submit-screen'),
        vote: document.getElementById('vote-screen'),
        result: document.getElementById('result-screen'),
        winner: document.getElementById('winner-screen'),
        loser: document.getElementById('loser-screen')
    };

    let activeTimers = [];

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
        // Clear any existing timers
        clearAllTimers();

        let time = duration;
        const timerElement = document.getElementById(elementId);

        if (timerElement) {
            timerElement.textContent = time;
        }

        const timerId = setInterval(() => {
            time--;

            if (timerElement) {
                timerElement.textContent = time;
            }

            if (time <= 0) {
                clearInterval(timerId);
                if (callback) callback();
            }
        }, 1000);

        activeTimers.push(timerId);
        return timerId;
    }

    // Clear all active timers
    function clearAllTimers() {
        activeTimers.forEach(timerId => clearInterval(timerId));
        activeTimers = [];
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

    // Show player disconnected notification
    function showDisconnectNotification(data) {
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
    }

    // Update player list
    function updatePlayerList(gameState, currentPlayerId) {
        const playersList = document.getElementById('players');
        playersList.innerHTML = '';

        gameState.players.forEach(player => {
            const li = document.createElement('li');
            li.textContent = `${player.name} ${player.id === currentPlayerId ? '(You) ' : ''}${player.alive ? '✅' : '💀'}`;
            if (player.id === gameState.host) {
                li.innerHTML += ' <span class="host-badge">HOST</span>';
            }
            playersList.appendChild(li);
        });
    }

    // Initialize UI event listeners
    function initUI() {
        // Create game button
        const createBtn = document.getElementById('create-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                const playerName = document.getElementById('player-name').value.trim();
                if (playerName) {
                    return { type: 'create-game', data: playerName };
                } else {
                    alert('Please enter your name');
                    return null;
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
                    return { type: 'join-game', data: { gameCode, playerName } };
                } else {
                    alert('Please enter your name and game code');
                    return null;
                }
            });
        }

        // Start game button (host only)
        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                return { type: 'start-game', data: null };
            });
        }

        // Submit action button
        const submitActionBtn = document.getElementById('submit-action');
        if (submitActionBtn) {
            submitActionBtn.addEventListener('click', () => {
                const action = document.getElementById('action-input').value.trim();
                if (action) {
                    submitActionBtn.disabled = true;
                    document.getElementById('submission-status').textContent = 'Submitted! Waiting for others...';
                    return { type: 'submit-action', data: { action } };
                } else {
                    alert('Please describe your action');
                    return null;
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
                return { type: 'copy-link', data: null };
            });
        }

        const shareQrBtn = document.getElementById('share-qr');
        if (shareQrBtn) {
            shareQrBtn.addEventListener('click', () => {
                return { type: 'share-qr', data: null };
            });
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
                    return { type: 'submit-vote', data: playerId };
                }
            }
            return null;
        });
    }

    // Get game link for sharing
    function getGameLink(gameCode) {
        return `${window.location.origin}${window.location.pathname}?game=${gameCode}`;
    }

    return {
        showScreen,
        startTimer,
        clearAllTimers,
        generateQRCode,
        showDisconnectNotification,
        updatePlayerList,
        initUI,
        getGameLink,
        screens
    };
}