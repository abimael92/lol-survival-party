// gameManager.js
export function initGameManager(socket, uiManager) {
    let playerId = null;
    let currentGameCode = null;
    let currentGameState = null;

    // Handle game creation
    function handleCreateGame(playerName) {
        socket.emit('create-game', playerName);
    }

    // Handle game joining
    function handleJoinGame(data) {
        currentGameCode = data.gameCode;
        socket.emit('join-game', data);
    }

    // Handle game start
    function handleStartGame() {
        socket.emit('start-game');
    }

    // Handle action submission
    function handleSubmitAction(data) {
        socket.emit('submit-action', data);
    }

    // Handle vote submission
    function handleSubmitVote(playerId) {
        socket.emit('submit-vote', playerId);
    }

    // Handle copy link
    function handleCopyLink() {
        if (currentGameCode) {
            const gameLink = uiManager.getGameLink(currentGameCode);
            navigator.clipboard.writeText(gameLink).then(() => {
                alert('Game link copied to clipboard!');
            }).catch(() => {
                alert('Failed to copy link. Please manually copy the URL.');
            });
        } else {
            alert('No game code available');
        }
    }

    // Handle QR code generation
    function handleShareQR() {
        if (currentGameCode) {
            const gameLink = uiManager.getGameLink(currentGameCode);
            uiManager.generateQRCode(gameLink);
        } else {
            alert('No game code available');
        }
    }

    const clientDebug = {
        logScreen: (screenName) => {
            console.log(`[CLIENT] Screen: ${screenName}, Game Code: ${currentGameCode}`);
        },
        logEvent: (eventName, data) => {
            console.log(`[CLIENT] Event: ${eventName}`, data);
        }
    };

    // Set up socket event handlers
    function setupSocketHandlers() {
        socket.on('game-created', (data) => {
            currentGameCode = data.gameCode;
            playerId = data.player.id;

            document.getElementById('game-code-display').textContent = `Game Code: ${currentGameCode}`;
            uiManager.showScreen('gameInfo');

            // Add yourself to player list
            const playersList = document.getElementById('players');
            const li = document.createElement('li');
            li.textContent = `${data.player.name} (You) 🎮`;
            playersList.appendChild(li);
        });

        socket.on('player-joined', (player) => {
            playerId = player.id;

            document.getElementById('player-name').disabled = true;
            document.getElementById('game-code-input').disabled = true;
            document.querySelectorAll('button').forEach(btn => {
                if (btn.id !== 'start-btn' && btn.id !== 'copy-link' && btn.id !== 'share-qr') {
                    btn.disabled = true;
                }
            });

            uiManager.showScreen('gameInfo');
        });

        socket.on('game-state-update', (gameState) => {
            currentGameState = gameState;
            uiManager.updatePlayerList(gameState, playerId);
        });

        socket.on('new-story', (storyData) => {
            let storyHTML = '';

            // Show introduction only for first round
            if (storyData.introduction) {
                storyHTML += `<div class="story-intro">${storyData.introduction}</div>`;
            }

            // Add scenario and crisis
            storyHTML += `
                <div class="story-scenario">${storyData.scenario}</div>
                <div class="story-crisis">${storyData.crisis}</div>
                <div class="story-item">Your Item: <strong>${storyData.playerItem}</strong></div>
            `;

            document.getElementById('story-content').innerHTML = storyHTML;
            uiManager.showScreen('story');
            uiManager.startTimer(20, 'story-time', () => {
                // Timer completed, server will handle phase change
            });
        });

        // In the setupSocketHandlers function
        socket.on('phase-change', (phase) => {
            // If game has ended, ignore all phase changes
            if (window.gameEnded) {
                console.log('Game has ended, ignoring phase change to:', phase);
                return;
            }

            if (phase === 'submit') {
                uiManager.showScreen('submit');
                document.getElementById('action-input').value = '';
                document.getElementById('submit-action').disabled = false;
                document.getElementById('submission-status').textContent = '';

                uiManager.startTimer(60, 'submit-time', () => {
                    document.getElementById('submission-status').textContent = 'Time\'s up!';
                });
            } else if (phase === 'story-resolution') {
                // This is handled by the story-resolution event
            } else if (phase === 'vote') {
                uiManager.showScreen('vote');
                uiManager.startTimer(45, 'vote-time', () => {
                    document.getElementById('vote-status').textContent = 'Time\'s up!';
                });
            }
        });

        socket.on('player-submitted', (data) => {
            document.getElementById('submission-status').textContent =
                `${data.submittedCount || 'Some'} players have submitted...`;

            // Check if all alive players have submitted
            const alivePlayers = currentGameState.players.filter(p => p.alive);
            if (data.submittedCount >= alivePlayers.length) {
                // All players have submitted, move to the next phase immediately
                document.getElementById('submission-status').textContent =
                    'All players have submitted! Moving to next phase...';

                // Clear the submission timer since all players have submitted
                uiManager.clearAllTimers();

                // Simulate server moving to next phase after a brief delay
                setTimeout(() => {
                    // This would normally be handled by the server
                    // For demo purposes, we'll simulate moving to voting phase
                    showVotingPhase();
                }, 2000);
            }
        });

        // Add handler for any server messages after game end
        socket.onAny((eventName, data) => {
            if (window.gameEnded && eventName !== 'game-winner' && eventName !== 'game-draw' && eventName !== 'game-ended') {
                console.log('Ignoring server event after game ended:', eventName);
            }
        });

        // Add debug to all event handlers
        socket.onAny((eventName, data) => {
            clientDebug.logEvent(eventName, data);

            // Log if game has ended but we're still receiving events
            if (window.gameEnded && !['game-winner', 'game-draw', 'game-ended'].includes(eventName)) {
                console.warn(`[CLIENT] Received ${eventName} after game ended!`);
            }
        });

        // Add this function to handle the voting phase
        function showVotingPhase() {
            // Simulate server sending voting data
            const votingData = {
                prompt: "All team members contributed... but let's be honest, some plans were better than others. Who should we leave behind for the team's survival?",
                submissions: {
                    'player1': {
                        text: "I will use my rubber chicken to distract the vampire with its hilarious squeaking!",
                        item: "rubber chicken",
                        playerName: "Player 1"
                    },
                    'player2': {
                        text: "I will use my whoopee cushion to create a diversion while we escape!",
                        item: "whoopee cushion",
                        playerName: "Player 2"
                    }
                }
            };

            // Show voting screen
            let votingHTML = `<div class="voting-prompt">${votingData.prompt}</div>`;
            votingHTML += `<div class="submissions-list">`;

            for (const [playerId, submission] of Object.entries(votingData.submissions)) {
                votingHTML += `
                    <div class="submission-item" data-player-id="${playerId}">
                        <div class="submission-text">"${submission.text}"</div>
                        <div class="submission-details">- ${submission.playerName} using ${submission.item}</div>
                        <div class="vote-count">Votes: 0</div>
                    </div>
                `;
            }

            votingHTML += `</div>`;
            document.getElementById('voting-content').innerHTML = votingHTML;
            uiManager.showScreen('vote');

            // Start voting timer
            uiManager.startTimer(45, 'vote-time', () => {
                document.getElementById('vote-status').textContent = 'Time\'s up!';
                // Handle voting timeout
                endVoting();
            });
        }

        // In the setupSocketHandlers function, update the voting-related handlers:

        socket.on('submissions-to-vote-on', (data) => {
            let votingHTML = `<div class="voting-prompt">${data.prompt}</div>`;

            votingHTML += `<div class="submissions-list">`;
            for (const [playerId, submission] of Object.entries(data.submissions)) {
                votingHTML += `
            <div class="submission-item" data-player-id="${playerId}">
                <div class="submission-text">"${submission.text}"</div>
                <div class="submission-details">- ${submission.playerName} using ${submission.item}</div>
                <div class="vote-count">Votes: 0</div>
            </div>
        `;
            }
            votingHTML += `</div>`;

            document.getElementById('voting-content').innerHTML = votingHTML;
            uiManager.showScreen('vote');

            // Clear any existing timers and start a new one
            uiManager.clearAllTimers();
            uiManager.startTimer(45, 'vote-time', () => {
                // When timer ends, automatically end voting
                endVoting();
            });
        });

        // Add this function to handle automatic voting end
        function endVoting() {
            document.getElementById('vote-status').textContent = 'Time\'s up!';

            // Simulate server-side voting completion after a brief delay
            setTimeout(() => {
                // This would normally be handled by the server
                // For demo purposes, we'll simulate a player being eliminated
                const players = currentGameState.players.filter(p => p.alive);
                if (players.length > 1) {
                    const randomPlayer = players[Math.floor(Math.random() * players.length)];

                    const deathMessage = `${randomPlayer.name} was eliminated due to timeout!`;
                    const continuationStory = `The story continues with the remaining survivors...`;

                    // Show elimination screen
                    const resultHTML = `
                <div class="elimination-story">
                    <h3>${randomPlayer.name} has been eliminated!</h3>
                    <div class="elimination-reason">${deathMessage}</div>
                    <div class="story-continuation">${continuationStory}</div>
                </div>
            `;

                    document.getElementById('result-content').innerHTML = resultHTML;
                    uiManager.showScreen('result');

                    // After showing results, move to next story phase
                    uiManager.startTimer(10, 'result-time', () => {
                        if (players.length - 1 > 1) {
                            // Continue with next story phase
                            socket.emit('request-next-phase');
                        } else {
                            // Game over - show winner
                            const winner = players.find(p => p.id !== randomPlayer.id);
                            const winnerHTML = `
                        <div class="final-chapter">
                            <h2>THE SAGA CONCLUDES</h2>
                            <div class="final-story">${winner.name} is the last survivor!</div>
                        </div>
                    `;
                            document.getElementById('winner-content').innerHTML = winnerHTML;
                            uiManager.showScreen('winner');
                        }
                    });
                }
            }, 2000);
        }

        // Add a function to completely disable all game interactions
        function disableGameInteractions() {
            // Disable all buttons except play-again and leave buttons
            document.querySelectorAll('button').forEach(button => {
                if (!button.id.includes('play-again') && !button.id.includes('leave-btn') && !button.id.includes('spectate-btn')) {
                    button.disabled = true;
                }
            });

            // Make all screens non-interactive except winner/loser screens
            document.querySelectorAll('.screen').forEach(screen => {
                if (!screen.id.includes('winner') && !screen.id.includes('loser')) {
                    screen.style.pointerEvents = 'none';
                }
            });
        }

        // Update the vote-confirmed handler to check if all players have voted
        socket.on('vote-confirmed', (votedId) => {
            document.getElementById('vote-status').textContent = 'Vote recorded!';

            document.querySelectorAll('.submission-item').forEach(item => {
                if (item.dataset.playerId === votedId) {
                    item.classList.add('voted');
                }
            });

            // Disable all voting buttons after voting
            document.querySelectorAll('.submission-item').forEach(item => {
                item.style.pointerEvents = 'none';
            });
        });

        socket.on('vote-confirmed', (votedId) => {
            document.getElementById('vote-status').textContent = 'Vote recorded!';

            document.querySelectorAll('.submission-item').forEach(item => {
                if (item.dataset.playerId === votedId) {
                    item.classList.add('voted');
                }
            });
        });

        socket.on('vote-update', (voteCounts) => {
            document.querySelectorAll('.submission-item').forEach(item => {
                const playerId = item.dataset.playerId;
                const voteCount = voteCounts[playerId] || 0;
                const voteCountElement = item.querySelector('.vote-count');
                if (voteCountElement) {
                    voteCountElement.textContent = `Votes: ${voteCount}`;
                }
            });
        });

        socket.on('player-sacrificed', (data) => {
            const resultHTML = `
                <div class="elimination-story">
                    <h3>${data.player.name} has been left behind!</h3>
                    <div class="elimination-reason">${data.message}</div>
                    <div class="story-continuation">${data.continuation}</div>
                </div>
            `;

            document.getElementById('result-content').innerHTML = resultHTML;
            uiManager.showScreen('result');
            uiManager.startTimer(15, 'result-time', () => {
                // Timer completed, server will handle next phase
            });
        });

        socket.on('game-winner', (data) => {
            const winnerHTML = `
                <div class="final-chapter">
                    <h2>THE SAGA CONCLUDES</h2>
                    <div class="final-story">${data.story}</div>
                </div>
                <div class="full-recap">
                    <h3>COMPLETE STORY</h3>
                    <pre>${data.recap}</pre>
                </div>
            `;

            document.getElementById('winner-content').innerHTML = winnerHTML;
            uiManager.showScreen('winner');

            // Clear all timers to prevent any automatic transitions
            uiManager.clearAllTimers();

            // Set a flag to indicate game has ended
            window.gameEnded = true;

            // Disable all game interactions
            disableGameInteractions();
        });

        socket.on('game-draw', (data) => {
            const drawHTML = `
                <div class="final-chapter">
                    <h2>AN UNEXPECTED CONCLUSION</h2>
                    <div class="final-story">${data.message}</div>
                </div>
                <div class="full-recap">
                    <h3>COMPLETE STORY</h3>
                    <pre>${data.recap}</pre>
                </div>
            `;

            document.getElementById('winner-content').innerHTML = drawHTML;
            uiManager.showScreen('winner');

            // Clear all timers to prevent any automatic transitions
            uiManager.clearAllTimers();
            window.gameEnded = true;

            // Disable all game interactions
            disableGameInteractions();
        });

        // Add handler for game-ended event
        socket.on('game-ended', (message) => {
            // Show a message that the game has ended
            const endedHTML = `
        <div class="final-chapter">
            <h2>GAME ENDED</h2>
            <div class="final-story">${message}</div>
        </div>
        <button id="return-to-lobby">Return to Lobby</button>
    `;

            document.getElementById('winner-content').innerHTML = endedHTML;
            uiManager.showScreen('winner');

            // Clear all timers to prevent any automatic transitions
            uiManager.clearAllTimers();
            window.gameEnded = true;

            // Add event listener for return to lobby button
            document.getElementById('return-to-lobby').addEventListener('click', () => {
                location.reload();
            });
        });

        // Handle players leaving the game
        socket.on('leave-game', () => {
            // Find the game this player is in
            const game = findGameBySocket(socket.id);
            if (game) {
                // Remove the player from the game
                game.players = game.players.filter(p => p.id !== socket.id);

                // If no players left, remove the game
                if (game.players.length === 0) {
                    games.delete(game.id);
                }
                // If host left, assign new host
                else if (game.host === socket.id) {
                    game.host = game.players[0].id;
                    io.to(game.id).emit('new-host', game.players[0].id);
                }

                // Notify remaining players
                io.to(game.id).emit('game-state-update', game);
            }

            // Leave the socket room
            socket.leave(game.id);
        });

        socket.on('player-disconnected', (data) => {
            uiManager.showDisconnectNotification(data);
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

        // Add handler for game-ended acknowledgement
        socket.on('game-ended-acknowledged', () => {
            const game = findGameBySocket(socket.id);
            if (game) {
                // Remove player from game since they acknowledged game end
                game.players = game.players.filter(p => p.id !== socket.id);

                if (game.players.length === 0) {
                    games.delete(game.id);
                }
            }
        });
    }

    // Handle UI events
    function handleUIEvent(event) {
        if (!event) return;

        switch (event.type) {
            case 'create-game':
                handleCreateGame(event.data);
                break;
            case 'join-game':
                handleJoinGame(event.data);
                break;
            case 'start-game':
                handleStartGame();
                break;
            case 'submit-action':
                handleSubmitAction(event.data);
                break;
            case 'submit-vote':
                handleSubmitVote(event.data);
                break;
            case 'copy-link':
                handleCopyLink();
                break;
            case 'share-qr':
                handleShareQR();
                break;
        }
    }

    return {
        setupSocketHandlers,
        handleUIEvent,
        getPlayerId: () => playerId,
        getGameCode: () => currentGameCode,
        getGameState: () => currentGameState
    };
}