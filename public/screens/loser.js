import { showScreen } from '../screenManager.js';

export function handleGameLoser(data) {
    showScreen('loser');
    const loserEl = document.getElementById('loser-content');
    if (!loserEl) return;

    loserEl.innerHTML = `
        <div class="loser-message">💀 You were eliminated!</div>
        ${data.reason ? `<div class="loser-reason">${data.reason}</div>` : ''}
    `;
}
