import { DOM } from './domHelpers.js';

export function initGamePhases(uiManager, socket) {
    let currentPhase = 'waiting';

    function setPhase(phase) {
        currentPhase = phase;
        console.log('Game phase:', phase);

        switch (phase) {
            case 'story':
                uiManager.showScreen('story');
                uiManager.startTimer(20, DOM.storyTimer(), () => {
                    setPhase('submit');
                });
                break;

            case 'submit':
                uiManager.showScreen('submit');
                DOM.actionInput().value = '';
                DOM.submitActionBtn().disabled = false;
                DOM.submissionStatus().textContent = '';

                uiManager.startTimer(60, DOM.submitTimer(), () => {
                    const action = DOM.actionInput().value.trim();
                    if (action) {
                        socket.emit('submit-action', { action });
                    }
                });
                break;

            case 'vote':
                uiManager.showScreen('vote');
                DOM.voteStatus().textContent = '';
                uiManager.startTimer(45, DOM.voteTimer(), () => {
                    // Voting auto-handled by server if needed
                });
                break;

            case 'result':
                uiManager.showScreen('result');
                uiManager.startTimer(15, DOM.resultTimer(), () => {
                    setPhase('story');
                });
                break;
        }
    }

    return { setPhase };
}
