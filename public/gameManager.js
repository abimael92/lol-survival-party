import { initGamePhases } from './gamePhases.js';
import { initSocketHandlers } from './socketHandlers.js';
import { initUIEvents } from './uiEvents.js';

export function initGameManager(socket, uiManager) {
    const playerIdRef = { value: null };
    const currentGameCodeRef = { value: null };
    const currentGameStateRef = { value: null };
    const isHostRef = { value: false };

    const { setPhase } = initGamePhases(uiManager, socket);
    const { setupSocketHandlers } = initSocketHandlers(socket, uiManager, setPhase, playerIdRef, currentGameCodeRef, isHostRef, currentGameStateRef);
    const { handleUIEvent } = initUIEvents(socket, currentGameCodeRef); // FIXED: Pass currentGameCodeRef instead of playerIdRef

    return {
        setupSocketHandlers,
        handleUIEvent,
        getPlayerId: () => playerIdRef.value,
        getGameCode: () => currentGameCodeRef.value,
        getGameState: () => currentGameStateRef.value,
        isHost: () => isHostRef.value
    };
}