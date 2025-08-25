import { socket, setPlayerId, setCurrentGameCode, setCurrentGameState } from '../socketManager.js';
import { showScreen } from '../screenManager.js';

// Generate QR code function
function generateQRCode(url) {
    const qrContainer = document.getElementById('qr-code');
    if (!qrContainer) return;

    qrContainer.innerHTML = '';
    const qrImg = document.createElement('img');
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}`;
    qrContainer.appendChild(qrImg);
}

export function initGame() {
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
                setCurrentGameCode(gameCode);
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
}

export function handleGameCreated(data) {
    setCurrentGameCode(data.gameCode);
    setPlayerId(data.player.id);

    document.getElementById('game-code-display').textContent = `Game Code: ${data.gameCode}`;
    document.getElementById('game-info').style.display = 'block';
    document.getElementById('player-list').style.display = 'block';
    document.getElementById('host-controls').style.display = 'block';
    document.getElementById('game-creation').style.display = 'none';

    // Add yourself to player list
    const playersList = document.getElementById('players');
    const li = document.createElement('li');
    li.textContent = `${data.player.name} (You) 🎮`;
    playersList.appendChild(li);
}

export function handlePlayerJoined(player) {
    setPlayerId(player.id);

    document.getElementById('player-name').disabled = true;
    document.getElementById('game-code-input').disabled = true;
    document.querySelectorAll('button').forEach(btn => {
        if (btn.id !== 'start-btn' && btn.id !== 'copy-link' && btn.id !== 'share-qr') {
            btn.disabled = true;
        }
    });

    document.getElementById('game-info').style.display = 'block';
    document.getElementById('player-list').style.display = 'block';
}

export function handleGameStateUpdate(gameState) {
    setCurrentGameState(gameState);
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
}