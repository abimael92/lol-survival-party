// gameManager.js (Client)
export function initGameManager(socket, uiManager) {
    let playerId = null;
    let currentGameCode = null;
    let currentGameState = null;

    // -------------------------
    // Core game actions
    // -------------------------
    function handleCreateGame(playerName) {
        socket.emit('create-game', playerName);
    }

    function handleJoinGame(data) {
        currentGameCode = data.gameCode;
        socket.emit('join-game', data);
    }

    function handleStartGame() {
        socket.emit('start-game');
    }

    function handleSubmitAction(action) {
        socket.emit('submit-action', { action });
    }

    function handleSubmitVote(votedId) {
        socket.emit('submit-vote', votedId);
    }

    function handleCopyLink() {
        if (!currentGameCode) return alert('No game code available');
        const gameLink = uiManager.getGameLink(currentGameCode);
        navigator.clipboard.writeText(gameLink).then(() => alert('Game link copied!'));
    }

    function handleShareQR() {
        if (!currentGameCode) return alert('No game code available');
        const gameLink = uiManager.getGameLink(currentGameCode);
        uiManager.generateQRCode(gameLink);
    }

    // -------------------------
    // Debug logger
    // -------------------------
    const clientDebug = {
        logEvent: (eventName, data) => console.log(`[CLIENT] Event: ${eventName}`, data),
        logScreen: (screenName) => console.log(`[CLIENT] Screen: ${screenName}`)
    };

    // -------------------------
    // Socket handlers
    // -------------------------
    function setupSocketHandlers() {

        socket.on('game-created', (data) => {
            currentGameCode = data.gameCode;
            playerId = data.player.id;

            document.getElementById('game-code-display').textContent = `Game Code: ${currentGameCode}`;
            uiManager.showScreen('gameInfo');

            const playersList = document.getElementById('players');
            const li = document.createElement('li');
            li.textContent = `${data.player.name} (You) 🎮`;
            playersList.appendChild(li);
        });

        socket.on('player-joined', (player) => {
            playerId = player.id;
            document.getElementById('player-name').disabled = true;
            document.getElementById('game-code-input').disabled = true;
            uiManager.showScreen('gameInfo');
        });

        socket.on('game-state-update', (gameState) => {
            currentGameState = gameState;
            uiManager.updatePlayerList(gameState, playerId);
        });

        socket.on('new-story', (storyData) => {
            let storyHTML = '';
            if (storyData.introduction) storyHTML += `<div class="story-intro">${storyData.introduction}</div>`;
            storyHTML += `<div class="story-scenario">${storyData.scenario}</div>`;
            storyHTML += `<div class="story-crisis">${storyData.crisis}</div>`;
            storyHTML += `<div class="story-item">Your Item: <strong>${storyData.playerItem}</strong></div>`;
            document.getElementById('story-content').innerHTML = storyHTML;
            uiManager.showScreen('story');
            uiManager.startTimer(20, 'story-time');
        });

        socket.on('phase-change', (phase) => {
            if (window.gameEnded) return;
            if (phase === 'submit') {
                uiManager.showScreen('submit');
                document.getElementById('action-input').value = '';
                document.getElementById('submit-action').disabled = false;
                uiManager.startTimer(60, 'submit-time');
            } else if (phase === 'vote') {
                uiManager.showScreen('vote');
                uiManager.startTimer(45, 'vote-time');
            }
        });

        socket.on('player-submitted', (data) => {
            document.getElementById('submission-status').textContent = `${data.submittedCount || 'Some'} players have submitted...`;
            const alivePlayers = currentGameState.players.filter(p => p.alive);
            if (data.submittedCount >= alivePlayers.length) {
                document.getElementById('submission-status').textContent = 'All submitted!';
                uiManager.clearAllTimers();
            }
        });

        socket.on('submissions-to-vote-on', (data) => {
            let votingHTML = `<div class="voting-prompt">${data.prompt}</div><div class="submissions-list">`;
            for (const [pid, submission] of Object.entries(data.submissions)) {
                votingHTML += `<div class="submission-item" data-player-id="${pid}">
                    <div class="submission-text">"${submission.text}"</div>
                    <div class="submission-details">- ${submission.playerName} using ${submission.item}</div>
                    <div class="vote-count">Votes: 0</div>
                </div>`;
            }
            votingHTML += '</div>';
            document.getElementById('voting-content').innerHTML = votingHTML;
            uiManager.showScreen('vote');
            uiManager.clearAllTimers();
            uiManager.startTimer(45, 'vote-time');
        });

        socket.on('vote-confirmed', (votedId) => {
            document.getElementById('vote-status').textContent = 'Vote recorded!';
            document.querySelectorAll('.submission-item').forEach(item => {
                if (item.dataset.playerId === votedId) item.classList.add('voted');
                item.style.pointerEvents = 'none';
            });
        });

        socket.on('vote-update', (voteCounts) => {
            document.querySelectorAll('.submission-item').forEach(item => {
                const playerId = item.dataset.playerId;
                const voteCount = voteCounts[playerId] || 0;
                const voteCountElement = item.querySelector('.vote-count');
                if (voteCountElement) voteCountElement.textContent = `Votes: ${voteCount}`;
            });
        });

        socket.on('player-sacrificed', (data) => {
            document.getElementById('result-content').innerHTML = `
                <div class="elimination-story">
                    <h3>${data.player.name} has been left behind!</h3>
                    <div class="elimination-reason">${data.message}</div>
                    <div class="story-continuation">${data.continuation}</div>
                </div>`;
            uiManager.showScreen('result');
            uiManager.startTimer(15, 'result-time');
        });

        socket.on('game-winner', (data) => {
            document.getElementById('winner-content').innerHTML = `
                <div class="final-chapter">
                    <h2>THE SAGA CONCLUDES</h2>
                    <div class="final-story">${data.story}</div>
                </div>
                <div class="full-recap">
                    <h3>COMPLETE STORY</h3>
                    <pre>${data.recap}</pre>
                </div>`;
            uiManager.showScreen('winner');
            uiManager.clearAllTimers();
            window.gameEnded = true;
        });

        socket.on('game-draw', (data) => {
            document.getElementById('winner-content').innerHTML = `
                <div class="final-chapter">
                    <h2>AN UNEXPECTED CONCLUSION</h2>
                    <div class="final-story">${data.message}</div>
                </div>
                <div class="full-recap">
                    <h3>COMPLETE STORY</h3>
                    <pre>${data.recap}</pre>
                </div>`;
            uiManager.showScreen('winner');
            uiManager.clearAllTimers();
            window.gameEnded = true;
        });

        socket.on('game-ended', (message) => {
            document.getElementById('winner-content').innerHTML = `
                <div class="final-chapter">
                    <h2>GAME ENDED</h2>
                    <div class="final-story">${message}</div>
                </div>
                <button id="return-to-lobby">Return to Lobby</button>`;
            uiManager.showScreen('winner');
            uiManager.clearAllTimers();
            window.gameEnded = true;
            document.getElementById('return-to-lobby').addEventListener('click', () => location.reload());
        });

        socket.on('player-disconnected', (data) => {
            uiManager.showDisconnectNotification(data);
        });

        // Debug logging for all events
        socket.onAny((eventName, data) => {
            clientDebug.logEvent(eventName, data);
        });
    }

    // -------------------------
    // UI event handler
    // -------------------------
    function handleUIEvent(event) {
        if (!event) return;
        switch (event.type) {
            case 'create-game': handleCreateGame(event.data); break;
            case 'join-game': handleJoinGame(event.data); break;
            case 'start-game': handleStartGame(); break;
            case 'submit-action': handleSubmitAction(event.data); break;
            case 'submit-vote': handleSubmitVote(event.data); break;
            case 'copy-link': handleCopyLink(); break;
            case 'share-qr': handleShareQR(); break;
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
