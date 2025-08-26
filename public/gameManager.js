// gameManager.js
export function initGameManager(socket, uiManager) {
    let playerId = null;
    let currentGameCode = null;
    let currentGameState = null;

    // Handle game creation
    function handleCreateGame(playerName) {
        socket.emit('create-game', playerName);
    }

    // Handle game joining
    function handleJoinGame(data) {
        currentGameCode = data.gameCode;
        socket.emit('join-game', data);
    }

    // Handle game start
    function handleStartGame() {
        socket.emit('start-game');
    }

    // Handle action submission
    function handleSubmitAction(data) {
        socket.emit('submit-action', data);
    }

    // Handle vote submission
    function handleSubmitVote(playerId) {
        socket.emit('submit-vote', playerId);
    }

    // Handle copy link
    function handleCopyLink() {
        if (currentGameCode) {
            const gameLink = uiManager.getGameLink(currentGameCode);
            navigator.clipboard.writeText(gameLink).then(() => {
                alert('Game link copied to clipboard!');
            }).catch(() => {
                alert('Failed to copy link. Please manually copy the URL.');
            });
        } else {
            alert('No game code available');
        }
    }

    // Handle QR code generation
    function handleShareQR() {
        if (currentGameCode) {
            const gameLink = uiManager.getGameLink(currentGameCode);
            uiManager.generateQRCode(gameLink);
        } else {
            alert('No game code available');
        }
    }

    // Set up socket event handlers
    function setupSocketHandlers() {
        socket.on('game-created', (data) => {
            currentGameCode = data.gameCode;
            playerId = data.player.id;

            document.getElementById('game-code-display').textContent = `Game Code: ${currentGameCode}`;
            document.getElementById('game-info').style.display = 'block';
            document.getElementById('player-list').style.display = 'block';
            document.getElementById('host-controls').style.display = 'block';
            document.getElementById('game-creation').style.display = 'none';

            // Add yourself to player list
            const playersList = document.getElementById('players');
            const li = document.createElement('li');
            li.textContent = `${data.player.name} (You) 🎮`;
            playersList.appendChild(li);
        });

        socket.on('player-joined', (player) => {
            playerId = player.id;

            document.getElementById('player-name').disabled = true;
            document.getElementById('game-code-input').disabled = true;
            document.querySelectorAll('button').forEach(btn => {
                if (btn.id !== 'start-btn' && btn.id !== 'copy-link' && btn.id !== 'share-qr') {
                    btn.disabled = true;
                }
            });

            document.getElementById('game-info').style.display = 'block';
            document.getElementById('player-list').style.display = 'block';
        });

        socket.on('game-state-update', (gameState) => {
            currentGameState = gameState;
            uiManager.updatePlayerList(gameState, playerId);
        });

        socket.on('new-story', (storyData) => {
            let storyHTML = '';

            // Show introduction only for first round
            if (storyData.introduction) {
                storyHTML += `<div class="story-intro">${storyData.introduction}</div>`;
            }

            // Add scenario and crisis
            storyHTML += `
                <div class="story-scenario">${storyData.scenario}</div>
                <div class="story-crisis">${storyData.crisis}</div>
                <div class="story-item">Your Item: <strong>${storyData.playerItem}</strong></div>
            `;

            document.getElementById('story-content').innerHTML = storyHTML;
            uiManager.showScreen('story');
            uiManager.startTimer(20, 'story-time', () => {
                // Timer completed, server will handle phase change
            });
        });

        socket.on('phase-change', (phase) => {
            if (phase === 'submit') {
                uiManager.showScreen('submit');
                document.getElementById('action-input').value = '';
                document.getElementById('submit-action').disabled = false;
                document.getElementById('submission-status').textContent = '';

                uiManager.startTimer(60, 'submit-time', () => {
                    document.getElementById('submission-status').textContent = 'Time\'s up!';
                });
            } else if (phase === 'story-resolution') {
                // This is handled by the story-resolution event
            } else if (phase === 'vote') {
                uiManager.showScreen('vote');
                uiManager.startTimer(45, 'vote-time', () => {
                    document.getElementById('vote-status').textContent = 'Time\'s up!';
                });
            }
        });

        // Story resolution showing all player actions and the silly resolution
        socket.on('story-resolution', (data) => {
            let resolutionHTML = `<div class="resolution-title">How the crisis was resolved:</div>`;

            for (const [playerId, submission] of Object.entries(data.submissions)) {
                resolutionHTML += `
                    <div class="player-resolution">
                        <strong>${submission.playerName}</strong> used their <em>${submission.item}</em> to 
                        ${submission.text}
                    </div>
                `;
            }

            // Add the silly resolution from the server
            resolutionHTML += `<div class="silly-resolution">${data.resolution}</div>`;

            document.getElementById('story-content').innerHTML = resolutionHTML;
            uiManager.showScreen('story');

            uiManager.startTimer(15, 'story-time', () => {
                // Timer completed, server will handle next phase
            });
        });

        socket.on('player-submitted', (data) => {
            document.getElementById('submission-status').textContent = `${data.submittedCount || 'Some'} players have submitted...`;
        });

        socket.on('submissions-to-vote-on', (data) => {
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
            uiManager.showScreen('vote');
            uiManager.startTimer(45, 'vote-time', () => {
                document.getElementById('vote-status').textContent = 'Time\'s up!';
            });
        });

        socket.on('vote-confirmed', (votedId) => {
            document.getElementById('vote-status').textContent = 'Vote recorded!';

            document.querySelectorAll('.submission-item').forEach(item => {
                if (item.dataset.playerId === votedId) {
                    item.classList.add('voted');
                }
            });
        });

        socket.on('vote-update', (voteCounts) => {
            document.querySelectorAll('.submission-item').forEach(item => {
                const playerId = item.dataset.playerId;
                const voteCount = voteCounts[playerId] || 0;
                const voteCountElement = item.querySelector('.vote-count');
                if (voteCountElement) {
                    voteCountElement.textContent = `Votes: ${voteCount}`;
                }
            });
        });

        socket.on('player-sacrificed', (data) => {
            const resultHTML = `
                <div class="elimination-story">
                    <h3>${data.player.name} has been left behind!</h3>
                    <div class="elimination-reason">${data.message}</div>
                    <div class="story-continuation">${data.continuation}</div>
                </div>
            `;

            document.getElementById('result-content').innerHTML = resultHTML;
            uiManager.showScreen('result');
            uiManager.startTimer(15, 'result-time', () => {
                // Timer completed, server will handle next phase
            });
        });

        socket.on('game-winner', (data) => {
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
            uiManager.showScreen('winner');
        });

        socket.on('game-draw', (data) => {
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
            uiManager.showScreen('winner');
        });

        socket.on('player-disconnected', (data) => {
            uiManager.showDisconnectNotification(data);
        });

        socket.on('error', (message) => {
            alert(`Error: ${message}`);
        });

        socket.on('new-host', (hostId) => {
            if (hostId === playerId) {
                document.getElementById('host-controls').style.display = 'block';
                alert('You are now the host!');
            }
        });
    }

    // Handle UI events
    function handleUIEvent(event) {
        if (!event) return;

        switch (event.type) {
            case 'create-game':
                handleCreateGame(event.data);
                break;
            case 'join-game':
                handleJoinGame(event.data);
                break;
            case 'start-game':
                handleStartGame();
                break;
            case 'submit-action':
                handleSubmitAction(event.data);
                break;
            case 'submit-vote':
                handleSubmitVote(event.data);
                break;
            case 'copy-link':
                handleCopyLink();
                break;
            case 'share-qr':
                handleShareQR();
                break;
        }
    }

    return {
        setupSocketHandlers,
        handleUIEvent,
        getPlayerId: () => playerId,
        getGameCode: () => currentGameCode,
        getGameState: () => currentGameState
    };
}