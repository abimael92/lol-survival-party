import { DOM } from './domHelpers.js';

export function initSocketHandlers(socket, uiManager, setPhase, playerIdRef, gameCodeRef, isHostRef, currentGameStateRef) {
    function setupSocketHandlers() {
        socket.on('game-created', (data) => {
            console.log('Game created:', data);
            gameCodeRef.value = data.gameCode;
            playerIdRef.value = data.player.id;
            isHostRef.value = true;

            DOM.gameCodeDisplay().textContent = `Game Code: ${gameCodeRef.value}`;
            uiManager.showScreen('game-info');

            const li = document.createElement('li');
            li.textContent = `${data.player.name} (You) 🎮`;
            DOM.playersList().appendChild(li);
        });

        socket.on('player-joined', (player) => {
            playerIdRef.value = player.id;
            uiManager.showScreen('game-info');
            DOM.playerName().disabled = true;
            DOM.gameCodeInput().disabled = true;
        });

        socket.on('game-state-update', (gameState) => {
            currentGameStateRef.value = gameState;
            uiManager.updatePlayerList(gameState, playerIdRef.value);

            if (gameState.host === playerIdRef.value) {
                isHostRef.value = true;
                DOM.hostControls().style.display = 'block';
                DOM.startBtn().disabled = gameState.players.length < 2;
            } else {
                DOM.hostControls().style.display = 'none';
            }
        });

        socket.on('new-story', (storyData) => {
            console.log('New story:', storyData);
            currentGameStateRef.value.storyData = storyData;

            let storyHTML = '';
            if (storyData.introduction) storyHTML += `<div class="story-intro">${storyData.introduction}</div>`;
            storyHTML += `
                <div class="story-scenario">${storyData.scenario}</div>
                <div class="story-crisis">${storyData.crisis}</div>
                <div class="story-item">Your Item: <strong>${storyData.playerItem}</strong></div>
            `;
            DOM.storyContent().innerHTML = storyHTML;
            setPhase('story');
        });

        socket.on('player-submitted', (data) => {
            DOM.submissionStatus().textContent =
                `${data.submittedCount || 'Some'} players have submitted...`;
        });

        socket.on('submissions-to-vote-on', (data) => {
            const votingHTML = `<div class="voting-prompt">${data.prompt}</div>` +
                `<div class="submissions-list">` +
                Object.entries(data.submissions).map(([pid, s]) => `
                    <div class="submission-item" data-player-id="${pid}">
                        <div class="submission-text">"${s.text}"</div>
                        <div class="submission-details">- ${s.playerName} using ${s.item}</div>
                        <div class="vote-count">Votes: 0</div>
                    </div>`).join('') +
                `</div>`;
            DOM.votingContent().innerHTML = votingHTML;
            setPhase('vote');
        });

        socket.on('vote-confirmed', () => {
            DOM.voteStatus().textContent = 'Vote recorded!';
        });

        socket.on('game-winner', (data) => {
            DOM.winnerContent().innerHTML = `<div class="final-story">${data.story}</div>`;
            uiManager.showScreen('winner');
        });
    }

    return { setupSocketHandlers };
}
