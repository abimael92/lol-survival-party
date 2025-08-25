import { showScreen, startTimer } from '../screenManager.js';
import { socket } from '../socketManager.js';

export function handleSubmissionsToVoteOn(submissions) {
    showScreen('vote');
    const voteContainer = document.getElementById('vote-list');
    if (!voteContainer) return;
    voteContainer.innerHTML = '';

    submissions.forEach(sub => {
        const div = document.createElement('div');
        div.classList.add('submission-item');
        div.dataset.playerId = sub.playerId;
        div.textContent = `${sub.playerName}: ${sub.story}`;
        voteContainer.appendChild(div);
    });

    startTimer(20, 'vote-time', () => { });
}

export function handleVoteConfirmed(voteData) {
    const votedItem = document.querySelector(`.submission-item[data-player-id="${voteData.votedPlayerId}"]`);
    if (votedItem) votedItem.classList.add('voted');
}

export function handleVoteUpdate(votes) {
    const voteContainer = document.getElementById('vote-list');
    if (!voteContainer) return;
    voteContainer.querySelectorAll('.submission-item').forEach(item => {
        const pid = item.dataset.playerId;
        const count = Object.values(votes).filter(v => v === pid).length;
        item.textContent += ` (Votes: ${count})`;
    });
}
