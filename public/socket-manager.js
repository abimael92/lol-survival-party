import { showScreen } from './screen-manager.js';
import { startTimer } from './timer.js';
import { setupSocket } from './socket-manager.js';
import { currentGameCode, playerId } from './game-state.js';

const socket = io();

document.addEventListener('DOMContentLoaded', () => {
    setupGameUI(socket);
    setupSocket(socket);
});

function setupGameUI(socket) {
    // Create game
    const createBtn = document.getElementById('create-btn');
    if (createBtn) createBtn.addEventListener('click', () => {
        const name = document.getElementById('player-name').value.trim();
        if (name) socket.emit('create-game', name);
        else alert('Enter your name');
    });

    // Join game
    const joinBtn = document.getElementById('join-btn');
    if (joinBtn) joinBtn.addEventListener('click', () => {
        const name = document.getElementById('player-name').value.trim();
        const code = document.getElementById('game-code-input').value.trim().toUpperCase();
        if (name && code) socket.emit('join-game', { playerName: name, gameCode: code });
        else alert('Enter name and game code');
    });

    // Submit action
    const submitBtn = document.getElementById('submit-action');
    if (submitBtn) submitBtn.addEventListener('click', () => {
        const action = document.getElementById('action-input').value.trim();
        if (action) {
            socket.emit('submit-action', { action });
            submitBtn.disabled = true;
            document.getElementById('submission-status').textContent = 'Submitted! Waiting for others...';
        } else alert('Describe your action');
    });

    // Play again
    const playAgainBtn = document.getElementById('play-again');
    if (playAgainBtn) playAgainBtn.addEventListener('click', () => location.reload());

    // Share link
    const copyLinkBtn = document.getElementById('copy-link');
    if (copyLinkBtn) copyLinkBtn.addEventListener('click', () => {
        if (currentGameCode) {
            navigator.clipboard.writeText(`${window.location.origin}?game=${currentGameCode}`)
                .then(() => alert('Link copied!'))
                .catch(() => alert('Copy failed'));
        } else alert('No game code available');
    });

    // QR code
    const shareQrBtn = document.getElementById('share-qr');
    if (shareQrBtn) shareQrBtn.addEventListener('click', () => {
        if (currentGameCode) {
            const qr = document.getElementById('qr-code');
            qr.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin + '?game=' + currentGameCode)}">`;
        } else alert('No game code available');
    });

    // Auto-fill game code from URL
    const params = new URLSearchParams(window.location.search);
    const gameFromUrl = params.get('game');
    if (gameFromUrl) document.getElementById('game-code-input').value = gameFromUrl;

    // Voting click
    document.addEventListener('click', (e) => {
        const item = e.target.closest('.submission-item');
        if (item && document.getElementById('vote-screen').classList.contains('active') &&
            !document.querySelector('.submission-item.voted')) {
            socket.emit('submit-vote', item.dataset.playerId);
        }
    });
}
