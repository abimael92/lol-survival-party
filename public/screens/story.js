import { showScreen, startTimer } from '../screenManager.js';
import { currentGameCode } from '../socketManager.js';

export function handleNewStory(storyData) {
    const storyContent = document.getElementById('story-content');
    if (!storyContent) return;

    let html = '';
    if (storyData.introduction) html += `<div class="story-intro">${storyData.introduction}</div>`;
    html += `
        <div class="story-scenario">${storyData.scenario}</div>
        <div class="story-crisis">${storyData.crisis}</div>
        <div class="story-item">Your Item: <strong>${storyData.playerItem}</strong></div>
    `;
    storyContent.innerHTML = html;
    showScreen('story');

    startTimer(20, 'story-time', () => {
        // server handles next phase
    });
}

export function handleStoryResolution(data) {
    const storyContent = document.getElementById('story-content');
    if (!storyContent) return;

    let html = `<div class="resolution-title">How the crisis was resolved:</div>`;
    for (const [pid, submission] of Object.entries(data.submissions)) {
        html += `<div class="player-resolution">
            <strong>${submission.playerName}</strong> used <em>${submission.item}</em> to ${submission.text}
        </div>`;
    }
    html += `<div class="silly-resolution">${data.resolution}</div>`;
    storyContent.innerHTML = html;
    showScreen('story');

    startTimer(15, 'story-time', () => { });
}
