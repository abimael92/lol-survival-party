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

    // Add to client.js to simulate server responses
    function simulateServerResponses() {
        // Listen for action submissions
        socket.on('submit-action', (data) => {
            // Simulate server acknowledging the submission
            const submittedCount = Math.min(2, Math.floor(Math.random() * 3) + 1); // Random between 1-2
            socket.emit('player-submitted', { submittedCount });

            // If both players have "submitted", automatically proceed
            if (submittedCount >= 2) {
                setTimeout(() => {
                    showVotingPhase();
                }, 2000);
            }
        });

        // Listen for phase change requests
        socket.on('request-next-phase', () => {
            // Simulate server sending a new story
            setTimeout(() => {
                const stories = [
                    {
                        scenario: "You've escaped the vampire's mansion but now find yourselves in a haunted forest!",
                        crisis: "The trees are coming to life and attacking! How do you use your item to survive?",
                        playerItem: "glowing amulet"
                    },
                    {
                        scenario: "You've made it to a mysterious cave for shelter.",
                        crisis: "A giant spider is blocking the exit! How do you use your item to get past it?",
                        playerItem: "magic whistle"
                    }
                ];

                const randomStory = stories[Math.floor(Math.random() * stories.length)];

                const storyData = {
                    scenario: randomStory.scenario,
                    crisis: randomStory.crisis,
                    playerItem: randomStory.playerItem
                };

                // Show the new story
                let storyHTML = `
                    <div class="story-scenario">${storyData.scenario}</div>
                    <div class="story-crisis">${storyData.crisis}</div>
                    <div class="story-item">Your Item: <strong>${storyData.playerItem}</strong></div>
                `;

                document.getElementById('story-content').innerHTML = storyHTML;
                uiManager.showScreen('story');

                // After reading time, move to submission phase
                uiManager.startTimer(15, 'story-time', () => {
                    uiManager.showScreen('submit');
                    document.getElementById('action-input').value = '';
                    document.getElementById('submit-action').disabled = false;
                    document.getElementById('submission-status').textContent = '';

                    uiManager.startTimer(60, 'submit-time', () => {
                        document.getElementById('submission-status').textContent = 'Time\'s up!';
                        // Auto-submit if time runs out
                        setTimeout(() => {
                            socket.emit('submit-action', {
                                action: "I panicked and couldn't think of anything!"
                            });
                        }, 2000);
                    });
                });
            }, 1000);
        });
    }

    // Call this function to simulate server responses
    simulateServerResponses();
});