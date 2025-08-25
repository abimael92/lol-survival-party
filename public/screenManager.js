// screenManager.js

// DOM elements for screens
export const screens = {
    welcome: document.getElementById('welcome-screen'),
    story: document.getElementById('story-screen'),
    submit: document.getElementById('submit-screen'),
    vote: document.getElementById('vote-screen'),
    result: document.getElementById('result-screen'),
    winner: document.getElementById('winner-screen'),
    loser: document.getElementById('loser-screen')
};

// DOM elements for timers
export const timerElements = {
    story: document.getElementById('story-time'),
    submit: document.getElementById('submit-time'),
    vote: document.getElementById('vote-time'),
    result: document.getElementById('result-time')
};

/**
 * Show only the specified screen and hide others
 * @param {string} screenName
 */
export function showScreen(screenName) {
    Object.values(screens).forEach(screen => {
        if (screen) screen.classList.remove('active');
    });
    if (screens[screenName]) screens[screenName].classList.add('active');
}

/**
 * Start a countdown timer
 * @param {number} duration - seconds
 * @param {string} elementId - key in timerElements or id of DOM element
 * @param {function} callback - function to call when timer ends
 */
export function startTimer(duration, elementId, callback) {
    let time = duration;
    const timerElement = timerElements[elementId] || document.getElementById(elementId);
    if (timerElement) timerElement.textContent = time;

    const countdown = setInterval(() => {
        time--;
        if (timerElement) timerElement.textContent = time;
        if (time <= 0) {
            clearInterval(countdown);
            if (callback) callback();
        }
    }, 1000);

    return countdown;
}

/**
 * Generate a QR code for a given URL
 * @param {string} url
 */
export function generateQRCode(url) {
    const qrContainer = document.getElementById('qr-code');
    if (!qrContainer) return;
    qrContainer.innerHTML = '';
    const qrImg = document.createElement('img');
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}`;
    qrContainer.appendChild(qrImg);
}

/**
 * Set up voting click handlers for submissions
 */
export function setupVoting(socket) {
    document.addEventListener('click', (e) => {
        const item = e.target.closest('.submission-item');
        if (!item) return;
        const pid = item.dataset.playerId;

        const voteScreen = screens.vote;
        if (voteScreen && voteScreen.classList.contains('active') && !document.querySelector('.submission-item.voted')) {
            socket.emit('submit-vote', pid);
        }
    });
}
