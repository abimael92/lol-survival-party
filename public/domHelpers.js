// Centralized DOM access
export const DOM = {
    // Screens
    welcomeScreen: () => document.getElementById('welcome-screen'),
    gameInfoScreen: () => document.getElementById('game-info-screen'),
    storyScreen: () => document.getElementById('story-screen'),
    submitScreen: () => document.getElementById('submit-screen'),
    voteScreen: () => document.getElementById('vote-screen'),
    resultScreen: () => document.getElementById('result-screen'),
    winnerScreen: () => document.getElementById('winner-screen'),
    loserScreen: () => document.getElementById('loser-screen'),

    // Inputs
    playerName: () => document.getElementById('player-name'),
    gameCodeInput: () => document.getElementById('game-code-input'),
    actionInput: () => document.getElementById('action-input'),

    // Buttons
    createBtn: () => document.getElementById('create-btn'),
    joinBtn: () => document.getElementById('join-btn'),
    submitActionBtn: () => document.getElementById('submit-action'),
    submitVoteBtn: () => document.getElementById('submit-vote'),
    startBtn: () => document.getElementById('start-btn'),
    copyLinkBtn: () => document.getElementById('copy-link'),
    playAgainBtn: () => document.getElementById('play-again'),
    spectateBtn: () => document.getElementById('spectate-btn'),
    leaveBtn: () => document.getElementById('leave-btn'),

    // Displays
    gameCodeDisplay: () => document.getElementById('game-code-display'),
    playersList: () => document.getElementById('players'),
    submissionStatus: () => document.getElementById('submission-status'),
    storyContent: () => document.getElementById('story-content'),
    votingContent: () => document.getElementById('voting-content'),
    voteStatus: () => document.getElementById('vote-status'),
    resultContent: () => document.getElementById('result-content'),
    winnerContent: () => document.getElementById('winner-content'),

    // Timers
    storyTimer: () => document.getElementById('story-time'),
    submitTimer: () => document.getElementById('submit-time'),
    voteTimer: () => document.getElementById('vote-time'),
    resultTimer: () => document.getElementById('result-time'),

    // Host controls
    hostControls: () => document.getElementById('host-controls')
};
