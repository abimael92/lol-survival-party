import { DOM } from './domHelpers.js';

export function initSocketHandlers(socket, uiManager, setPhase, playerIdRef, gameCodeRef, isHostRef, currentGameStateRef) {
    function setupSocketHandlers() {
        socket.on('game-created', (data) => {
            console.log('Game created:', data);
            gameCodeRef.value = data.gameCode;  // Fixed: was currentGameCodeRef
            playerIdRef.value = data.player.id;
            isHostRef.value = true;

            DOM.gameCodeDisplay().textContent = `Game Code: ${gameCodeRef.value}`;
            uiManager.showScreen('game-info');

            if (typeof QRCode !== 'undefined') {
                const gameLink = `${window.location.origin}?game=${data.gameCode}`;
                document.getElementById('qr-code').innerHTML = '';
                new QRCode(document.getElementById('qr-code'), gameLink);
            }

            const li = document.createElement('li');
            li.textContent = `${data.player.name} (You) 🎮`;
            DOM.playersList().appendChild(li);
        });

        socket.on('player-joined', (data) => {
            console.log('Player joined:', data);
            playerIdRef.value = data.player.id;
            gameCodeRef.value = data.gameCode; // ADD THIS LINE - Set the game code
            isHostRef.value = false; // ADD THIS LINE - Player joining is not host

            DOM.gameCodeDisplay().textContent = `Game Code: ${data.gameCode}`; // ADD THIS LINE
            uiManager.showScreen('game-info');
            DOM.playerName().disabled = true;
            DOM.gameCodeInput().disabled = true;

            // ADD THIS SECTION - Add player to list
            const li = document.createElement('li');
            li.textContent = `${data.player.name} (You) 🎮`;
            DOM.playersList().appendChild(li);
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

        // In socketHandlers.js - Update the voting section
        socket.on('submissions-to-vote-on', (data) => {
            const votingHTML = `<div class="voting-prompt">${data.prompt}</div>` +
                `<div class="submissions-list">` +
                Object.entries(data.submissions).map(([pid, s]) => `
            <div class="submission-item" data-player-id="${pid}">
                <input type="radio" name="vote" value="${pid}" id="vote-${pid}">
                <label for="vote-${pid}">
                    <div class="submission-text">"${s.text}"</div>
                    <div class="submission-details">- ${s.playerName} using ${s.item}</div>
                </label>
                <div class="vote-count">Votes: 0</div>
            </div>`).join('') +
                `</div>`;
            DOM.votingContent().innerHTML = votingHTML;

            // Add click handlers for voting
            DOM.votingContent().querySelectorAll('.submission-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    if (e.target.type !== 'radio') {
                        const radio = item.querySelector('input[type="radio"]');
                        radio.checked = true;
                        item.classList.add('voted');
                        DOM.votingContent().querySelectorAll('.submission-item').forEach(other => {
                            if (other !== item) other.classList.remove('voted');
                        });
                    }
                });
            });

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