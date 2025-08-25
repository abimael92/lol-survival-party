import { showScreen, startTimer } from '../screenManager.js';

export function handlePlayerSacrificed(data) {
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
}