// DOM elements
const screens = {
    welcome: document.getElementById('welcome-screen'),
    story: document.getElementById('story-screen'),
    submit: document.getElementById('submit-screen'),
    vote: document.getElementById('vote-screen'),
    result: document.getElementById('result-screen'),
    winner: document.getElementById('winner-screen'),
    loser: document.getElementById('loser-screen')
};

// Show only the specified screen
export function showScreen(screenName) {
    Object.values(screens).forEach(screen => {
        screen.classList.remove('active');
    });
    if (screens[screenName]) {
        screens[screenName].classList.add('active');
    }
}

// Timer elements
export const timerElements = {
    story: document.getElementById('story-time'),
    submit: document.getElementById('submit-time'),
    vote: document.getElementById('vote-time'),
    result: document.getElementById('result-time')
};

// Start a timer with visual countdown
export function startTimer(duration, elementId, callback) {
    let time = duration;
    const timerElement = document.getElementById(elementId);

    if (timerElement) {
        timerElement.textContent = time;
    }

    const countdown = setInterval(() => {
        time--;

        if (timerElement) {
            timerElement.textContent = time;
        }

        if (time <= 0) {
            clearInterval(countdown);
            if (callback) callback();
        }
    }, 1000);

    return countdown;
}