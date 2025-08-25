import { showScreen } from '../screenManager.js';

// Play again button
const playAgainBtn = document.getElementById('play-again');
if (playAgainBtn) {
    playAgainBtn.addEventListener('click', () => {
        location.reload();
    });
}

export function handleGameWinner(data) {
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
}

export function handleGameDraw(data) {
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
}