import { DOM } from './domHelpers.js';

export function initGamePhases(uiManager, socket) {
    let currentPhase = 'waiting';

    function setPhase(phase) {

        DOM.submitActionBtn().replaceWith(DOM.submitActionBtn().cloneNode(true));
        DOM.submitVoteBtn().replaceWith(DOM.submitVoteBtn().cloneNode(true));

        currentPhase = phase;
        console.log('Game phase:', phase);

        switch (phase) {
            case 'waiting':
                uiManager.showScreen('result'); // Use result screen as waiting area
                DOM.resultContent().innerHTML = `
                    <div class="waiting-message">
                        <h3>Waiting for game to start...</h3>
                        <div class="spinner">⏳</div>
                    </div>
                `;
                break;

            case 'story':
                uiManager.showScreen('story');
                uiManager.startTimer(20, 'story-time', () => {
                    // Auto-submit empty action if no input
                    const action = DOM.actionInput().value.trim();
                    if (!action) {
                        socket.emit('submit-action', { action: "I choose to do nothing." });
                    }
                    setPhase('submit');
                });
                break;

            case 'submit':
                uiManager.showScreen('submit');

                DOM.actionInput().value = '';
                DOM.submitActionBtn().disabled = false;
                DOM.submissionStatus().textContent = '';

                uiManager.startTimer(30, 'submit-time', () => {
                    const action = DOM.actionInput().value.trim();

                    if (action) {
                        socket.emit('submit-action', { action });

                        DOM.submissionStatus().textContent = 'Submitted!';
                        DOM.submitActionBtn().disabled = true;
                    } else {
                        socket.emit('submit-action', { action: "I choose to do nothing." });

                        DOM.submissionStatus().textContent = 'Auto-submitted!';
                        DOM.submitActionBtn().disabled = true;
                    }
                });

                const submitHandler = () => {
                    const action = DOM.actionInput().value.trim();
                    if (action) {
                        socket.emit('submit-action', { action });
                        DOM.submissionStatus().textContent = 'Submitted!';
                        DOM.submitActionBtn().disabled = true;
                        DOM.submitActionBtn().removeEventListener('click', submitHandler);
                    } else {
                        alert('Please enter your action first!');
                    }
                };

                DOM.submitActionBtn().addEventListener('click', submitHandler);
                break;

            case 'review':
                // Show all submissions review
                uiManager.showScreen('result');
                uiManager.startTimer(10, 'result-time', () => {
                    // Move to voting after review
                    socket.emit('request-voting-phase');
                });
                break;

            case 'vote':
                uiManager.showScreen('vote');

                DOM.voteStatus().textContent = '';

                const voteHandler = () => {
                    const selectedVote = document.querySelector('input[name="vote"]:checked');
                    if (selectedVote) {
                        socket.emit('submit-vote', { vote: selectedVote.value });
                        DOM.voteStatus().textContent = 'Vote recorded! Waiting for others...';
                        DOM.submitVoteBtn().disabled = true;
                        DOM.submitVoteBtn().removeEventListener('click', voteHandler);
                    } else {
                        alert('Please select a player to vote for!');
                    }
                };

                DOM.submitVoteBtn().addEventListener('click', voteHandler);

                uiManager.startTimer(45, 'vote-time', () => {
                    const selectedVote = document.querySelector('input[name="vote"]:checked');

                    if (!selectedVote) {
                        const firstVote = document.querySelector('input[name="vote"]');

                        if (firstVote) {
                            firstVote.checked = true;
                            socket.emit('submit-vote', { vote: firstVote.value });
                            DOM.voteStatus().textContent = 'Auto-voted!';
                            DOM.submitVoteBtn().disabled = true;
                        }
                    }
                });
                break;

            case 'result':
                uiManager.showScreen('result');
                // uiManager.startTimer(15, 'result-time', () => {
                //     // Next phase handled by server
                // });
                break;
        }
    }

    return { setPhase };
}