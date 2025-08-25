import { showScreen, startTimer } from './screenManager.js';
import { handleGameCreated, handlePlayerJoined, handleGameStateUpdate } from './screens/welcome.js';
import { handleNewStory } from './screens/story.js';
import { handlePhaseChange, handlePlayerSubmitted } from './screens/submit.js';
import { handleStoryResolution } from './screens/story.js';
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

// Set up voting functionality
function setupVoting() {
    document.addEventListener('click', (e) => {
        if (e.target.closest('.submission-item')) {
            const submissionItem = e.target.closest('.submission-item');
            const playerId = submissionItem.dataset.playerId;

            // Only allow voting if we're on the vote screen and haven't voted yet
            const voteScreen = document.getElementById('vote-screen');
            if (voteScreen.classList.contains('active') && !document.querySelector('.submission-item.voted')) {
                socket.emit('submit-vote', playerId);
            }
        }
    });
}

export function setupSocketHandlers() {
    // Socket event handlers
    socket.on('game-created', handleGameCreated);
    socket.on('player-joined', handlePlayerJoined);
    socket.on('game-state-update', handleGameStateUpdate);
    socket.on('new-story', handleNewStory);
    socket.on('phase-change', handlePhaseChange);
    socket.on('player-submitted', handlePlayerSubmitted);
    socket.on('story-resolution', handleStoryResolution);
    socket.on('submissions-to-vote-on', handleSubmissionsToVoteOn);
    socket.on('vote-confirmed', handleVoteConfirmed);
    socket.on('vote-update', handleVoteUpdate);
    socket.on('player-sacrificed', handlePlayerSacrificed);
    socket.on('game-winner', handleGameWinner);
    socket.on('game-draw', handleGameDraw);

    socket.on('player-disconnected', (data) => {
        const notification = document.createElement('div');
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.background = 'rgba(233, 69, 96, 0.9)';
        notification.style.color = 'white';
        notification.style.padding = '10px';
        notification.style.borderRadius = '5px';
        notification.style.zIndex = '1000';
        notification.textContent = `${data.player} disconnected! ${data.message}`;

        document.body.appendChild(notification);

        setTimeout(() => {
            document.body.removeChild(notification);
        }, 5000);
    });

    socket.on('error', (message) => {
        alert(`Error: ${message}`);
    });

    socket.on('new-host', (hostId) => {
        if (hostId === playerId) {
            document.getElementById('host-controls').style.display = 'block';
            alert('You are now the host!');
        }
    });

    setupVoting();
}