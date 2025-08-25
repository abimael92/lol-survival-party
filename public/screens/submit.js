import { showScreen, startTimer } from '../screenManager.js';
import { socket } from '../socketManager.js';

export function handlePhaseChange(phaseData) {
    showScreen('submit');

    const promptEl = document.getElementById('submit-prompt');
    if (promptEl) promptEl.textContent = phaseData.prompt;

    const submitInput = document.getElementById('submit-input');
    const submitBtn = document.getElementById('submit-btn');

    submitBtn?.addEventListener('click', () => {
        if (submitInput?.value.trim()) {
            socket.emit('submit-action', { story: submitInput.value.trim() });
            submitInput.value = '';
        }
    });

    startTimer(30, 'submit-time', () => {
        if (submitInput?.value.trim()) {
            socket.emit('submit-action', { story: submitInput.value.trim() });
            submitInput.value = '';
        }
    });
}

export function handlePlayerSubmitted(data) {
    const submissionsList = document.getElementById('submitted-list');
    if (submissionsList) {
        const li = document.createElement('li');
        li.textContent = `${data.playerName} submitted their action`;
        submissionsList.appendChild(li);
    }
}
