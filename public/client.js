// client.js - Entry point that replaces main.js
import { initUIManager } from './uiManager.js';
import { initGameManager } from './gameManager.js';
import { setupApp } from './appSetup.js';

const socket = io();

document.addEventListener('DOMContentLoaded', () => {
    const uiManager = initUIManager();
    const gameManager = initGameManager(socket, uiManager);

    gameManager.setupSocketHandlers();
    setupApp(gameManager);
});