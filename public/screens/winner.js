import { showScreen } from '../screenManager.js';

export function handleGameWinner(data) {
    showScreen('winner');
    const winnerEl = document.getElementById('winner-content');
    if (!winnerEl) return;
    winnerEl.innerHTML = `<div class="winner-message">🏆 Winner: ${data.playerName}</div>`;
}

export function handleGameDraw(data) {
    showScreen('winner');
    const winnerEl = document.getElementById('winner-content');
    if (!winnerEl) return;
    winnerEl.innerHTML = `<div class="winner-message">🤝 It's a draw!</div>`;
}
