import { showScreen, startTimer } from '../screenManager.js';

export function handleSubmissionsToVoteOn(data) {
    let votingHTML = `<div class="voting-prompt">${data.prompt}</div>`;

    votingHTML += `<div class="submissions-list">`;
    for (const [playerId, submission] of Object.entries(data.submissions)) {
        votingHTML += `
            <div class="submission-item" data-player-id="${playerId}">
                <div class="submission-text">"${submission.text}"</div>
                <div class="submission-details">- ${submission.playerName} using ${submission.item}</div>
                <div class="vote-count">Votes: 0</div>
            </div>
        `;
    }
    votingHTML += `</div>`;

    document.getElementById('voting-content').innerHTML = votingHTML;
    showScreen('vote');
    startTimer(45, 'vote-time', () => {
        document.getElementById('vote-status').textContent = 'Time\'s up!';
    });
}

export function handleVoteConfirmed(votedId) {
    document.getElementById('vote-status').textContent = 'Vote recorded!';

    document.querySelectorAll('.submission-item').forEach(item => {
        if (item.dataset.playerId === votedId) {
            item.classList.add('voted');
        }
    });
}

export function handleVoteUpdate(voteCounts) {
    document.querySelectorAll('.submission-item').forEach(item => {
        const playerId = item.dataset.playerId;
        const voteCount = voteCounts[playerId] || 0;
        const voteCountElement = item.querySelector('.vote-count');
        if (voteCountElement) {
            voteCountElement.textContent = `Votes: ${voteCount}`;
        }
    });
}