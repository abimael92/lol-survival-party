export function renderResult(container) {
    container.classList.add("screen");
    container.innerHTML = `
        <h2>Sacrifice Result</h2>
        <div id="result-content"></div>
        <div id="result-timer">Next round in: <span id="result-time">15</span>s</div>
    `;

    container.setup = function () {
        let time = 15;
        const timerEl = document.getElementById("result-time");
        const interval = setInterval(() => {
            time--;
            timerEl.textContent = time;
            if (time <= 0) clearInterval(interval);
        }, 1000);
    };
}
