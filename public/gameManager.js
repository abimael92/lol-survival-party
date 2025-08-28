export function initGameManager(socket, uiManager) {
    let playerId = null;
    let currentGameCode = null;
    let currentGameState = null;

    function handleUIEvent(event) {
        if (!event) return;
        switch (event.type) {
            case 'create-game': socket.emit('create-game', event.data); break;
            case 'join-game': socket.emit('join-game', event.data); break;
            case 'start-game': socket.emit('start-game'); break;
            case 'submit-action': socket.emit('submit-action', event.data); break;
            case 'submit-vote': socket.emit('submit-vote', event.data); break;
            case 'copy-link':
                if (currentGameCode) navigator.clipboard.writeText(uiManager.getGameLink(currentGameCode));
                break;
            case 'share-qr':
                if (currentGameCode) uiManager.generateQRCode(uiManager.getGameLink(currentGameCode));
                break;
        }
    }

    function setupSocketHandlers() {
        socket.on('game-created', data => {
            currentGameCode = data.gameCode;
            playerId = data.player.id;
            document.getElementById('game-code-display').textContent = `Game Code: ${currentGameCode}`;
            uiManager.showScreen('gameInfo');
        });

        socket.on('player-joined', player => {
            playerId = player.id;
            uiManager.showScreen('gameInfo');
        });

        socket.on('phase-change', phase => {
            if (phase === 'submit') uiManager.showScreen('submit');
            else if (phase === 'vote') uiManager.showScreen('vote');
        });

        socket.on('submissions-to-vote-on', data => {
            let html = `<div>${data.prompt}</div><div class="submissions-list">`;
            for (const [pid, sub] of Object.entries(data.submissions)) {
                html += `<div class="submission-item" data-player-id="${pid}">
                    <div>${sub.text}</div><div>${sub.playerName} using ${sub.item}</div>
                    <div class="vote-count">Votes: 0</div></div>`;
            }
            html += `</div>`;
            document.getElementById('voting-content').innerHTML = html;
            uiManager.showScreen('vote');
        });

        socket.on('vote-confirmed', votedId => {
            document.querySelectorAll('.submission-item').forEach(item => {
                if (item.dataset.playerId === votedId) item.classList.add('voted');
            });
        });

        socket.on('vote-update', counts => {
            document.querySelectorAll('.submission-item').forEach(item => {
                const pid = item.dataset.playerId;
                const el = item.querySelector('.vote-count');
                if (el) el.textContent = `Votes: ${counts[pid] || 0}`;
            });
        });

        socket.on('game-winner', data => {
            document.getElementById('winner-content').innerHTML = `
                <div>Winner: ${data.winner.name}</div>
                <div>${data.story}</div>
                <pre>${data.recap}</pre>
            `;
            uiManager.showScreen('winner');
            window.gameEnded = true;
        });

        socket.on('game-draw', data => {
            document.getElementById('winner-content').innerHTML = `
                <div>DRAW</div><div>${data.message}</div><pre>${data.recap}</pre>
            `;
            uiManager.showScreen('winner');
            window.gameEnded = true;
        });

        socket.on('game-ended', msg => {
            document.getElementById('winner-content').innerHTML = `<div>${msg}</div>`;
            uiManager.showScreen('winner');
            window.gameEnded = true;
        });

        socket.on('player-disconnected', data => uiManager.showDisconnectNotification(data));
    }

    return { setupSocketHandlers, handleUIEvent, getPlayerId: () => playerId, getGameCode: () => currentGameCode, getGameState: () => currentGameState };
}
