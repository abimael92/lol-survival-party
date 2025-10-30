import { DOM } from './domHelpers.js';

export function initSocketHandlers(socket, uiManager, setPhase, playerIdRef, gameCodeRef, isHostRef, currentGameStateRef) {
    function setupSocketHandlers() {
        socket.on('game-created', (data) => {
            console.log('Game created:', data);
            console.log('Player object:', data.player);
            console.log('Player name:', data.player?.name);
            console.log('Player type:', typeof data.player);

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

            // ADD THIS: Trigger immediate player list update
            uiManager.updatePlayerList({ players: [data.player], host: data.player.id }, playerIdRef.value);
        });

        socket.on('player-joined', (data) => {
            console.log('Player joined:', data);
            console.log('Player object:', data.player);
            console.log('Player name:', data.player?.name);

            playerIdRef.value = data.player.id;
            gameCodeRef.value = data.gameCode;
            isHostRef.value = false;

            DOM.gameCodeDisplay().textContent = `Game Code: ${data.gameCode}`;
            uiManager.showScreen('game-info');
            DOM.playerName().disabled = true;
            DOM.gameCodeInput().disabled = true;

            uiManager.updatePlayerList({ players: [data.player], host: data.gameState?.host }, playerIdRef.value);

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

        // NEW: Show all submissions before voting
        socket.on('all-submissions-received', (data) => {
            console.log('All submissions received:', data);
            let reviewHTML = `<h3>All Plans Submitted:</h3><div class="submissions-review">`;

            // FIX: Handle both array and object formats
            const submissions = Array.isArray(data.submissions) ? data.submissions : Object.values(data.submissions);

            submissions.forEach((submission, index) => {
                // FIX: Handle different data structures
                const playerName = submission.playerName || submission.name || 'Unknown Player';
                const text = submission.text || submission.action || 'No action submitted';
                const item = submission.item || submission.playerItem || 'Unknown item';

                reviewHTML += `
                    <div class="submission-review-item">
                        <div class="player-name">${playerName}</div>
                        <div class="submission-text">"${text}"</div>
                        <div class="item-used">Using: ${item}</div>
                    </div>
                `;
            });

            reviewHTML += `</div>`;
            DOM.resultContent().innerHTML = reviewHTML;
            setPhase('result');
        });

        // NEW: Show story resolution
        socket.on('story-resolution', (data) => {
            console.log('Story resolution:', data);
            let resolutionHTML = `
                <div class="story-resolution">
                    <h3>What Actually Happened...</h3>
                    <div class="resolution-text">${data.resolution}</div>
                    <div class="sense-of-relief">${data.relief}</div>
                    <div class="sacrifice-reason">${data.sacrificeReason}</div>
                </div>
            `;
            DOM.resultContent().innerHTML = resolutionHTML;
            // Stay on result screen for this
        });

        // FIXED: Voting section with proper data handling
        socket.on('submissions-to-vote-on', (data) => {
            console.log('Submissions to vote on - RAW DATA:', data);

            // FIX: Handle different data structures
            let submissions = data.submissions;
            if (!submissions) {
                console.error('No submissions data received');
                return;
            }

            // Convert to array if it's an object
            if (!Array.isArray(submissions)) {
                submissions = Object.entries(submissions).map(([playerId, submission]) => ({
                    playerId,
                    ...submission
                }));
            }

            console.log('Processed submissions for voting:', submissions);

            const votingHTML = `
                <div class="voting-prompt">${data.prompt || 'Who should be sacrificed?'}</div>
                <div class="submissions-list">
                    ${submissions.map((submission, index) => {
                // FIX: Handle different data structures safely
                const playerId = submission.playerId || submission.id || `player-${index}`;
                const playerName = submission.playerName || submission.name || 'Unknown Player';
                const text = submission.text || submission.action || 'No action submitted';
                const item = submission.item || submission.playerItem || 'Unknown item';

                return `
                            <div class="submission-item" data-player-id="${playerId}">
                                <input type="radio" name="vote" value="${playerId}" id="vote-${playerId}">
                                <label for="vote-${playerId}">
                                    <div class="player-name-voting">${playerName}</div>
                                    <div class="submission-text">"${text}"</div>
                                    <div class="submission-details">using ${item}</div>
                                </label>
                                <div class="vote-count">Votes: <span id="votes-${playerId}">0</span></div>
                            </div>
                        `;
            }).join('')}
                </div>
            `;

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

        // NEW: Update vote counts in real-time
        socket.on('vote-update', (data) => {
            console.log('Vote update:', data);
            if (data.votes) {
                Object.entries(data.votes).forEach(([playerId, voteCount]) => {
                    const voteElement = document.getElementById(`votes-${playerId}`);
                    if (voteElement) {
                        voteElement.textContent = voteCount;
                    }
                });
            }
        });

        socket.on('vote-confirmed', (data) => {
            console.log('Vote confirmed:', data);
            DOM.voteStatus().textContent = 'Vote recorded! Waiting for others...';

            // FIX: Update the vote count immediately for the voted player
            if (data.votedFor && data.currentVotes) {
                const voteElement = document.getElementById(`votes-${data.votedFor}`);
                if (voteElement) {
                    voteElement.textContent = data.currentVotes[data.votedFor] || 0;
                }
            }
        });

        // NEW: Show voting results
        socket.on('voting-complete', (data) => {
            console.log('Voting complete:', data);
            let resultsHTML = `
                <div class="voting-results">
                    <h3>Voting Results:</h3>
                    <div class="eliminated-player">${data.eliminatedPlayerName} has been eliminated!</div>
                    <div class="elimination-reason">${data.eliminationReason}</div>
                    <div class="story-continuation">${data.storyContinuation}</div>
                </div>
            `;
            DOM.resultContent().innerHTML = resultsHTML;
            setPhase('result');
        });

        socket.on('game-winner', (data) => {
            DOM.winnerContent().innerHTML = `<div class="final-story">${data.story}</div>`;
            uiManager.showScreen('winner');
        });

        // NEW: Show waiting screen
        socket.on('waiting-for-players', (data) => {
            console.log('Waiting for players:', data);
            DOM.resultContent().innerHTML = `
                <div class="waiting-message">
                    <h3>Waiting for other players...</h3>
                    <div class="waiting-count">${data.waitingCount || 0} players ready</div>
                    <div class="spinner">⏳</div>
                </div>
            `;
            setPhase('result');
        });

        // NEW: Handle submission phase completion
        socket.on('submission-phase-complete', (data) => {
            console.log('Submission phase complete:', data);
            // This should trigger the review screen
            socket.emit('request-submissions-review');
        });
    }

    return { setupSocketHandlers };
}