// screens/welcome.js
import { socket, setPlayerId, setCurrentGameCode, setCurrentGameState, currentGameCode, getPlayerId } from '../socketManager.js';

export function initGame() {
    const playerNameInput = document.getElementById('player-name');
    const gameCodeInput = document.getElementById('game-code-input');
    const createBtn = document.getElementById('create-btn');
    const joinBtn = document.getElementById('join-btn');
    const startBtn = document.getElementById('start-btn');
    const copyLinkBtn = document.getElementById('copy-link');
    const shareQrBtn = document.getElementById('share-qr');

    const generateQRCode = (url) => {
        const qrContainer = document.getElementById('qr-code');
        if (!qrContainer) return;
        qrContainer.innerHTML = '';
        const qrImg = document.createElement('img');
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}`;
        qrContainer.appendChild(qrImg);
    };

    // Create game
    createBtn?.addEventListener('click', () => {
        const playerName = playerNameInput?.value.trim();
        if (playerName) socket.emit('create-game', playerName);
        else alert('Please enter your name');
    });

    // Join game
    joinBtn?.addEventListener('click', () => {
        const playerName = playerNameInput?.value.trim();
        const gameCode = gameCodeInput?.value.trim().toUpperCase();
        if (playerName && gameCode) {
            setCurrentGameCode(gameCode);
            socket.emit('join-game', { gameCode, playerName });
        } else alert('Please enter your name and game code');
    });

    // Start game
    startBtn?.addEventListener('click', () => socket.emit('start-game'));

    // Copy / QR
    copyLinkBtn?.addEventListener('click', () => {
        if (currentGameCode) {
            const gameLink = `${window.location.origin}${window.location.pathname}?game=${currentGameCode}`;
            navigator.clipboard.writeText(gameLink).then(() => alert('Copied!')).catch(() => alert('Failed'));
        } else alert('No game code');
    });
    shareQrBtn?.addEventListener('click', () => {
        if (currentGameCode) generateQRCode(`${window.location.origin}${window.location.pathname}?game=${currentGameCode}`);
        else alert('No game code');
    });

    // Prefill from URL
    const gameCodeFromUrl = new URLSearchParams(window.location.search).get('game');
    if (gameCodeFromUrl) gameCodeInput.value = gameCodeFromUrl;
}

export function handleGameCreated(data) {
    setCurrentGameCode(data.gameCode);
    setPlayerId(data.player.id);

    document.getElementById('game-code-display')?.textContent = `Game Code: ${data.gameCode}`;
    document.getElementById('game-info')?.style.setProperty('display', 'block');
    document.getElementById('player-list')?.style.setProperty('display', 'block');
    document.getElementById('host-controls')?.style.setProperty('display', 'block');
    document.getElementById('game-creation')?.style.setProperty('display', 'none');

    const playersList = document.getElementById('players');
    if (playersList) {
        const li = document.createElement('li');
        li.textContent = `${data.player.name} (You) 🎮`;
        playersList.appendChild(li);
    }
}

export function handlePlayerJoined(player) {
    setPlayerId(player.id);

    document.getElementById('player-name')?.setAttribute('disabled', 'true');
    document.getElementById('game-code-input')?.setAttribute('disabled', 'true');

    document.querySelectorAll('button').forEach(btn => {
        if (!['start-btn', 'copy-link', 'share-qr'].includes(btn.id)) btn.disabled = true;
    });

    document.getElementById('game-info')?.style.setProperty('display', 'block');
    document.getElementById('player-list')?.style.setProperty('display', 'block');
}

export function handleGameStateUpdate(gameState) {
    setCurrentGameState(gameState);
    const playersList = document.getElementById('players');
    if (playersList) {
        playersList.innerHTML = '';
        gameState.players.forEach(player => {
            const li = document.createElement('li');
            li.textContent = `${player.name} ${player.id === getPlayerId() ? '(You)' : ''} ${player.alive ? '✅' : '💀'}`;

            if (player.id === gameState.host) {
                li.innerHTML += ' <span class="host-badge">HOST</span>';
            }

            playersList.appendChild(li);
        });
    }
}
