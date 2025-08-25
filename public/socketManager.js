import { io } from "/socket.io/socket.io.js";


export function initSocket() {
    if (!socket) socket = io();

    socket.on("game-created", ({ gameCode, player }) => {
        console.log("Game created:", gameCode, player);
        // Optionally update UI: show game code, player list, host controls
    });

    socket.on("game-state-update", (game) => {
        console.log("Game state:", game);
        // Update player list dynamically
    });

    return socket;
}

