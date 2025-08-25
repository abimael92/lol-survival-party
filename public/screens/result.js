import { showScreen, startTimer } from '../screenManager.js';

export function handlePlayerSacrificed(data) {
    showScreen('result');
    const resultEl = document.getElementById('result-content');
    if (!resultEl) return;
    resultEl.innerHTML = `<div class="sacrificed-player">${data.playerName} was sacrificed!</div>`;
    startTimer(10, 'result-time', () => { });
}
