export function startTimer(duration, elementId, callback) {
    let time = duration;
    const timerEl = document.getElementById(elementId);
    if (timerEl) timerEl.textContent = time;

    const interval = setInterval(() => {
        time--;
        if (timerEl) timerEl.textContent = time;
        if (time <= 0) {
            clearInterval(interval);
            if (callback) callback();
        }
    }, 1000);

    return interval;
}
