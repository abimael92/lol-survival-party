// client.js
const socket = io();

// Import managers
import { initUIManager } from './uiManager.js';
import { initGameManager } from './gameManager.js';

// Initialize the game when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    const uiManager = initUIManager();
    const gameManager = initGameManager(socket, uiManager);

    // Initialize UI with game manager reference
    uiManager.initUI(gameManager);

    // Set up socket event handlers
    gameManager.setupSocketHandlers();

    // Check for game code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const gameCodeFromUrl = urlParams.get('game');
    if (gameCodeFromUrl) {
        document.getElementById('game-code-input').value = gameCodeFromUrl;
    }


});