// welcome.js
import { socket, setPlayerId, setCurrentGameCode, setCurrentGameState, currentGameCode } from '../socketManager.js';
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
    const playerNameInput = document.getElementById('player-name');
    const gameCodeInput = document.getElementById('game-code-input');
    const createBtn = document.getElementById('create-btn');
    const joinBtn = document.getElementById('join-btn');
    const startBtn = document.getElementById('start-btn');
    const copyLinkBtn = document.getElementById('copy-link');
    const shareQrBtn = document.getElementById('share-qr');

    // Create game
    if (createBtn && playerNameInput) {
        createBtn.addEventListener('click', () => {
            const playerName = playerNameInput.value.trim();
            if (playerName) {
                socket.emit('create-game', playerName);
            } else {
                alert('Please enter your name');
            }
        });
    }

    // Join game
    if (joinBtn && playerNameInput && gameCodeInput) {
        joinBtn.addEventListener('click', () => {
            const playerName = playerNameInput.value.trim();
            const gameCode = gameCodeInput.value.trim().toUpperCase();
            if (playerName && gameCode) {
                setCurrentGameCode(gameCode);
                socket.emit('join-game', { gameCode, playerName });
            } else {
                alert('Please enter your name and game code');
            }
        });
    }

    // Start game (host only)
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            socket.emit('start-game');
        });
    }

    // Copy link button
    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', () => {
            if (currentGameCode) {
                const gameLink = `${window.location.origin}${window.location.pathname}?game=${currentGameCode}`;
                navigator.clipboard.writeText(gameLink).then(() => {
                    alert('Game link copied to clipboard!');
                }).catch(() => {
                    alert('Failed to copy link. Please copy manually.');
                });
            } else {
                alert('No game code available');
            }
        });
    }

    // Share QR button
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

    // Prefill game code from URL
    const urlParams = new URLSearchParams(window.location.search);
    const gameCodeFromUrl = urlParams.get('game');
    if (gameCodeFromUrl && gameCodeInput) {
        gameCodeInput.value = gameCodeFromUrl;
    }
}

export function handleGameCreated(data) {
    setCurrentGameCode(data.gameCode);
    setPlayerId(data.player.id);

    const gameCodeDisplay = document.getElementById('game-code-display');
    const gameInfo = document.getElementById('game-info');
    const playerListContainer = document.getElementById('player-list');
    const hostControls = document.getElementById('host-controls');
    const gameCreation = document.getElementById('game-creation');
    const playersList = document.getElementById('players');

    if (gameCodeDisplay) gameCodeDisplay.textContent = `Game Code: ${data.gameCode}`;
    if (gameInfo) gameInfo.style.display = 'block';
    if (playerListContainer) playerListContainer.style.display = 'block';
    if (hostControls) hostControls.style.display = 'block';
    if (gameCreation) gameCreation.style.display = 'none';

    // Add yourself to player list
    if (playersList) {
        const li = document.createElement('li');
        li.textContent = `${data.player.name} (You) 🎮`;
        playersList.appendChild(li);
    }
}

export function handlePlayerJoined(player) {
    setPlayerId(player.id);

    const playerNameInput = document.getElementById('player-name');
    const gameCodeInput = document.getElementById('game-code-input');
    const buttons = document.querySelectorAll('button');
    const gameInfo = document.getElementById('game-info');
    const playerListContainer = document.getElementById('player-list');

    if (playerNameInput) playerNameInput.disabled = true;
    if (gameCodeInput) gameCodeInput.disabled = true;
    buttons.forEach(btn => {
        if (!['start-btn', 'copy-link', 'share-qr'].includes(btn.id)) btn.disabled = true;
    });
    if (gameInfo) gameInfo.style.display = 'block';
    if (playerListContainer) playerListContainer.style.display = 'block';
}

export function handleGameStateUpdate(gameState) {
    const playersList = document.getElementById('players');
    setCurrentGameState(gameState);

    if (playersList) {
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
}
