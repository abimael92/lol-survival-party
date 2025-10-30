// uiManager.js
export function initUIManager() {
    const timers = {};

    function showScreen(screen) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const target = document.getElementById(`${screen}-screen`);
        if (target) target.classList.add('active');
    }

    function startTimer(seconds, elementId, callback) {
        clearTimer(elementId);
        let remaining = seconds;
        const el = document.getElementById(elementId);
        if (!el) return;

        el.textContent = remaining;
        timers[elementId] = setInterval(() => {
            remaining--;
            el.textContent = remaining;
            if (remaining <= 0) {
                clearTimer(elementId);
                callback();
            }
        }, 1000);
    }

    function clearTimer(elementId) {
        if (timers[elementId]) {
            clearInterval(timers[elementId]);
            delete timers[elementId];
        }
    }

    function clearAllTimers() {
        Object.keys(timers).forEach(clearTimer);
    }

    function getGameLink(code) {
        return `${window.location.origin}?game=${code}`;
    }

    function generateQRCode(link) {
        const qrContainer = document.getElementById('qr-code');
        qrContainer.innerHTML = '';
        new QRCode(qrContainer, link);
    }

    function updatePlayerList(gameState, currentPlayerId) {
        const ul = document.getElementById('players');
        ul.innerHTML = '';
        gameState.players.forEach(p => {
            const li = document.createElement('li');

            // Create player name with "You" indicator
            const nameSpan = document.createElement('span');
            nameSpan.textContent = p.name + (p.id === currentPlayerId ? ' (You) ' : '');
            li.appendChild(nameSpan);

            // Add host badge if this player is host
            if (p.id === gameState.host) {
                const badge = document.createElement('span');
                badge.textContent = ' HOST';
                badge.className = 'host-badge';
                badge.style.marginLeft = '10px';
                badge.style.background = '#e94560';
                badge.style.padding = '2px 8px';
                badge.style.borderRadius = '10px';
                badge.style.fontSize = '0.8em';
                li.appendChild(badge);
            }

            ul.appendChild(li);
        });
    }

    function showDisconnectNotification(player) {
        alert(`${player.name} has disconnected`);
    }

    return {
        showScreen,
        startTimer,
        clearTimer,
        clearAllTimers,
        getGameLink,
        generateQRCode,
        updatePlayerList,
        showDisconnectNotification
    };
}