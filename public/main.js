// main.js
import { initGame } from './screens/welcome.js';
import { setupSocketHandlers } from './socketManager.js';
import { initScreens, showScreen } from './screenManager.js';

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar los elementos del DOM
    initScreens();

    // Iniciar el juego
    initGame();

    // Conectar sockets
    setupSocketHandlers();
});
