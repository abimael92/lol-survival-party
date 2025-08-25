import { initGame } from './screens/welcome.js';
import { setupSocketHandlers } from './socketManager.js';
import { showScreen } from './screenManager.js';

// Initialize the game when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    initGame();
    setupSocketHandlers();
});