// client.js
const socket = io();
let playerId = null;
let currentGameCode = null;
let currentGameState = null;

// Import managers
import { initUIManager } from './uiManager.js';
import { initGameManager } from './gameManager.js';

// Initialize the game when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    const uiManager = initUIManager();
    const gameManager = initGameManager(socket, uiManager);

    // Initialize UI
    uiManager.initUI();

    // Set up socket event handlers
    gameManager.setupSocketHandlers();

    // Check for game code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const gameCodeFromUrl = urlParams.get('game');
    if (gameCodeFromUrl) {
        document.getElementById('game-code-input').value = gameCodeFromUrl;
    }
});