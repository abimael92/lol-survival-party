import { socket } from '../socketManager.js';
import { showScreen, startTimer } from '../screenManager.js';

// Submit action button
const submitActionBtn = document.getElementById('submit-action');
if (submitActionBtn) {
    submitActionBtn.addEventListener('click', () => {
        const action = document.getElementById('action-input').value.trim();
        if (action) {
            socket.emit('submit-action', { action });
            submitActionBtn.disabled = true;
            document.getElementById('submission-status').textContent = 'Submitted! Waiting for others...';
        } else {
            alert('Please describe your action');
        }
    });
}

export function handlePhaseChange(phase) {
    if (phase === 'submit') {
        showScreen('submit');
        document.getElementById('action-input').value = '';
        document.getElementById('submit-action').disabled = false;
        document.getElementById('submission-status').textContent = '';

        startTimer(60, 'submit-time', () => {
            document.getElementById('submission-status').textContent = 'Time\'s up!';
        });
    }
}

export function handlePlayerSubmitted(data) {
    document.getElementById('submission-status').textContent = `${data.submittedCount || 'Some'} players have submitted...`;
}