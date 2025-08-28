// gameManager.js
export function initGameManager(socket, uiManager) {
    let playerId = null;
    let currentGameCode = null;
    let currentGameState = null;
    window.gameEnded = false;

    // ---------- GAME ACTIONS ----------
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
        socket.emit('submit-action', action);
    }

    function handleSubmitVote(votedId) {
        socket.emit('submit-vote', votedId);
    }

    function handleCopyLink() {
        if (currentGameCode) {
            const link = uiManager.getGameLink(currentGameCode);
            navigator.clipboard.writeText(link).then(() => alert('Game link copied!'));
        } else alert('No game code available.');
    }

    function handleShareQR() {
        if (currentGameCode) {
            const link = uiManager.getGameLink(currentGameCode);
            uiManager.generateQRCode(link);
        } else alert('No game code available.');
    }

    // ---------- SOCKET HANDLERS ----------
    function setupSocketHandlers() {

        socket.on('game-created', (data) => {
            currentGameCode = data.gameCode;
            playerId = data.player.id;
            uiManager.showScreen('gameInfo');
            uiManager.updatePlayerList({ players: [data.player] }, playerId);
        });

        socket.on('player-joined', (player) => {
            uiManager.showScreen('gameInfo');
        });

        socket.on('game-state-update', (gameState) => {
            currentGameState = gameState;
            uiManager.updatePlayerList(gameState, playerId);
        });

        socket.on('new-story', (storyData) => {
            let html = '';
            if (storyData.introduction) html += `<div>${storyData.introduction}</div>`;
            html += `<div>${storyData.scenario}</div><div>${storyData.crisis}</div>`;
            html += `<div>Your item: <strong>${storyData.playerItem}</strong></div>`;
            document.getElementById('story-content').innerHTML = html;
            uiManager.showScreen('story');
            uiManager.startTimer(10, 'story-time', () => { });
        });

        socket.on('phase-change', (phase) => {
            if (window.gameEnded) return;
            if (phase === 'submit') {
                uiManager.showScreen('submit');
                uiManager.startTimer(30, 'submit-time', () => { });
            } else if (phase === 'vote') {
                uiManager.showScreen('vote');
                uiManager.startTimer(25, 'vote-time', () => { });
            }
        });

        socket.on('submissions-to-vote-on', (data) => {
            showVotingScreen(data);
        });

        socket.on('player-submitted', (data) => {
            document.getElementById('submission-status').textContent =
                `${data.submittedCount} players submitted`;
        });

        socket.on('vote-confirmed', (votedId) => {
            const items = document.querySelectorAll('.submission-item');
            items.forEach(item => {
                if (item.dataset.playerId === votedId) item.classList.add('voted');
            });
        });

        socket.on('vote-update', (voteCounts) => {
            document.querySelectorAll('.submission-item').forEach(item => {
                const count = voteCounts[item.dataset.playerId] || 0;
                item.querySelector('.vote-count').textContent = `Votes: ${count}`;
            });
        });

        socket.on('player-sacrificed', (data) => {
            document.getElementById('result-content').innerHTML = `
                <h3>${data.player.name} was left behind!</h3>
                <div>${data.message}</div>
                <div>${data.continuation}</div>
            `;
            uiManager.showScreen('result');
            uiManager.startTimer(15, 'result-time', () => { });
        });

        socket.on('game-winner', (data) => {
            showGameEndScreen('winner', data.story, data.recap);
        });

        socket.on('game-draw', (data) => {
            showGameEndScreen('winner', data.message, data.recap);
        });

        socket.on('game-ended', (message) => {
            showGameEndScreen('winner', message, '');
        });
    }

    // ---------- HELPERS ----------
    function showVotingScreen(data) {
        let html = `<div>${data.prompt}</div><div class="submissions-list">`;
        for (const [pid, s] of Object.entries(data.submissions)) {
            html += `<div class="submission-item" data-player-id="${pid}">
                        <div>${s.text}</div>
                        <div>- ${s.playerName} (${s.item})</div>
                        <div class="vote-count">Votes: 0</div>
                     </div>`;
        }
        html += '</div>';
        document.getElementById('voting-content').innerHTML = html;
        uiManager.showScreen('vote');
    }

    function showGameEndScreen(screen, story, recap) {
        window.gameEnded = true;
        uiManager.clearAllTimers();
        disableGameInteractions();

        document.getElementById('winner-content').innerHTML = `
            <h2>GAME OVER</h2>
            <div>${story}</div>
            <pre>${recap}</pre>
            <button id="play-again">Play Again</button>
        `;
        uiManager.showScreen(screen);

        document.getElementById('play-again').onclick = () => location.reload();
    }

    function disableGameInteractions() {
        document.querySelectorAll('button').forEach(btn => btn.disabled = true);
        document.querySelectorAll('.screen').forEach(s => s.style.pointerEvents = 'none');
    }

    // ---------- UI EVENT HANDLER ----------
    function handleUIEvent(event) {
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

    return { setupSocketHandlers, handleUIEvent, getPlayerId: () => playerId, getGameCode: () => currentGameCode };
}
