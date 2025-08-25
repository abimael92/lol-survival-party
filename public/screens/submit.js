export function renderSubmit(container) {
    container.classList.add("screen");
    container.innerHTML = `
        <h2>Your Plan</h2>
        <p id="action-prompt" class="prompt"></p>
        <textarea id="action-input" placeholder="Describe how you'd use the item..." rows="4"></textarea>
        <button id="submit-action">Submit</button>
        <div id="submit-timer">Time left: <span id="submit-time">60</span>s</div>
        <div id="submission-status"></div>
    `;

    container.setup = function () {
        document.getElementById("submit-action").onclick = () => {
            const action = document.getElementById("action-input").value;
            console.log("Submitted action:", action);
        };
        let time = 60;
        const timerEl = document.getElementById("submit-time");
        const interval = setInterval(() => {
            time--;
            timerEl.textContent = time;
            if (time <= 0) clearInterval(interval);
        }, 1000);
    };
}
