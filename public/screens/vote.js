export function renderVote(container) {
    container.classList.add("screen");
    container.innerHTML = `
        <h2>Time to Vote</h2>
        <div id="voting-content"></div>
        <div id="vote-timer">Time left: <span id="vote-time">45</span>s</div>
        <div id="vote-status"></div>
    `;

    container.setup = function () {
        let time = 45;
        const timerEl = document.getElementById("vote-time");
        const interval = setInterval(() => {
            time--;
            timerEl.textContent = time;
            if (time <= 0) clearInterval(interval);
        }, 1000);
    };
}
