// socketManager.js
import { showScreen, startTimer, setupVoting as screenVoting } from './screenManager.js';
import {
    handleGameCreated, handlePlayerJoined, handleGameStateUpdate
} from './screens/welcome.js';
import { handleNewStory, handleStoryResolution } from './screens/story.js';
import { handlePhaseChange, handlePlayerSubmitted } from './screens/submit.js';
import { handleSubmissionsToVoteOn, handleVoteConfirmed, handleVoteUpdate } from './screens/vote.js';
import { handlePlayerSacrificed } from './screens/result.js';
import { handleGameWinner, handleGameDraw } from './screens/winner.js';

export const socket = io();
export let playerId = null;
export let currentGameCode = null;
export let currentGameState = null;

export function setPlayerId(id) {
    playerId = id;
}

export function setCurrentGameCode(code) {
    currentGameCode = code;
}

export function setCurrentGameState(state) {
    currentGameState = state;
}

/**
 * Show a notification message on the screen
 * @param {string} message
 * @param {string} bgColor
 */
function showNotification(message, bgColor = 'rgba(233, 69, 96, 0.9)') {
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.background = bgColor;
    notification.style.color = 'white';
    notification.style.padding = '10px';
    notification.style.borderRadius = '5px';
    notification.style.zIndex = '1000';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        document.body.removeChild(notification);
    }, 5000);
}

/**
 * Initialize all socket event handlers
 */
export function setupSocketHandlers() {
    // Welcome / lobby
    socket.on('game-created', handleGameCreated);
    socket.on('player-joined', handlePlayerJoined);
    socket.on('game-state-update', handleGameStateUpdate);

    // Story phase
    socket.on('new-story', handleNewStory);
    socket.on('story-resolution', handleStoryResolution);

    // Submit phase
    socket.on('phase-change', handlePhaseChange);
    socket.on('player-submitted', handlePlayerSubmitted);

    // Voting phase
    socket.on('submissions-to-vote-on', handleSubmissionsToVoteOn);
    socket.on('vote-confirmed', handleVoteConfirmed);
    socket.on('vote-update', handleVoteUpdate);

    // Results
    socket.on('player-sacrificed', handlePlayerSacrificed);
    socket.on('game-winner', handleGameWinner);
    socket.on('game-draw', handleGameDraw);

    // Player disconnect
    socket.on('player-disconnected', (data) => {
        showNotification(`${data.player} disconnected! ${data.message}`);
    });

    // Errors
    socket.on('error', (message) => showNotification(`Error: ${message}`, 'rgba(200,0,0,0.9)'));

    // Host assignment
    socket.on('new-host', (hostId) => {
        if (hostId === playerId) {
            const hostControls = document.getElementById('host-controls');
            if (hostControls) hostControls.style.display = 'block';
            showNotification('You are now the host!', 'rgba(0, 123, 255, 0.9)');
        }
    });

    // Voting
    screenVoting(socket);
}
