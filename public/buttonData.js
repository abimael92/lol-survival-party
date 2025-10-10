// buttonData.js
import { DOM } from './domHelpers.js';

export function getButtonData(button) {
    switch (button.id) {
        case 'create-btn':
            return { playerName: DOM.playerName().value.trim() };
        case 'join-btn':
            return {
                playerName: DOM.playerName().value.trim(),
                gameCode: DOM.gameCodeInput().value.trim().toUpperCase()
            };
        case 'submit-action':
            return { action: DOM.actionInput().value.trim() };
        case 'submit-vote':
            return { vote: document.querySelector('input[name="vote"]:checked')?.value };
        default:
            return null;
    }
}
