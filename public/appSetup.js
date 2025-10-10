import { getButtonData } from './buttonData.js';
import { DOM } from './domHelpers.js';

export function setupApp(gameManager) {
    // Prefill game code from URL
    const urlParams = new URLSearchParams(window.location.search);
    const gameCodeFromUrl = urlParams.get('game');
    if (gameCodeFromUrl) {
        DOM.gameCodeInput().value = gameCodeFromUrl.toUpperCase().trim();
    }

    // UNIVERSAL UI EVENT HANDLER
    document.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', (event) => {
            event.preventDefault();
            const type = btn.dataset.action;
            const data = getButtonData(btn);
            console.log('Button clicked:', type, data);
            if (type) {
                gameManager.handleUIEvent({ type, data });
            }
        });
    });

    // Press Enter in player name or game code input
    DOM.playerName().addEventListener('keypress', (e) => {
        if (e.key === 'Enter') DOM.createBtn().click();
    });

    DOM.gameCodeInput().addEventListener('keypress', (e) => {
        if (e.key === 'Enter') DOM.joinBtn().click();
    });
}
