export function initUIEvents(socket, gameCodeRef) {
    function handleUIEvent(event) {
        switch (event.type) {
            case 'create-game':
                if (!event.data?.playerName) {
                    alert('Please enter your name!');
                    return;
                }
                socket.emit('create-game', { playerName: event.data.playerName });
                break;

            case 'join-game':
                if (!event.data?.playerName || !event.data?.gameCode) {
                    alert('Please enter your name and game code!');
                    return;
                }
                socket.emit('join-game', {
                    playerName: event.data.playerName,
                    gameCode: event.data.gameCode
                });
                break;

            case 'start-game':
                socket.emit('start-game');
                break;

            case 'submit-action':
                if (!event.data?.action) return;
                socket.emit('submit-action', { action: event.data.action });
                break;

            case 'submit-vote':
                if (!event.data?.vote) return;
                socket.emit('submit-vote', { vote: event.data.vote });
                break;

            case 'copy-link':
                if (gameCodeRef.value) {
                    navigator.clipboard.writeText(`${window.location.origin}?game=${gameCodeRef.value}`);
                }
                break;

            case 'play-again':
                window.location.reload();
                break;

            case 'spectate':
                alert('Spectate feature coming soon!');
                break;

            case 'leave-game':
                window.location.href = '/';
                break;
        }
    }

    return { handleUIEvent };
}
