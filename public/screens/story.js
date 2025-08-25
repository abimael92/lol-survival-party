export function renderStory(container, storyData) {
    container.classList.add("screen");
    container.innerHTML = `
        <h2>The Story</h2>
        <div id="story-content"></div>
        <div id="story-timer">Time left: <span id="story-time">20</span>s</div>
    `;

    container.setup = function () {
        const storyContent = document.getElementById("story-content");
        storyContent.innerHTML = `
            ${storyData.introduction ? `<div class="story-intro">${storyData.introduction}</div>` : ''}
            <div class="story-scenario">${storyData.scenario}</div>
            <div class="story-crisis">${storyData.crisis}</div>
            <div class="story-item">Your Item: <strong>${storyData.playerItem}</strong></div>
        `;

        // Timer countdown
        let time = 20;
        const timerEl = document.getElementById("story-time");
        const interval = setInterval(() => {
            time--;
            timerEl.textContent = time;
            if (time <= 0) clearInterval(interval);
        }, 1000);
    };
}
