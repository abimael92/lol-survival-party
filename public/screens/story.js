import { showScreen, startTimer } from '../screenManager.js';

export function handleNewStory(storyData) {
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
    showScreen('story');
    startTimer(20, 'story-time', () => {
        // Timer completed, server will handle phase change
    });
}

export function handleStoryResolution(data) {
    let resolutionHTML = `<div class="resolution-title">How the crisis was resolved:</div>`;

    for (const [playerId, submission] of Object.entries(data.submissions)) {
        resolutionHTML += `
            <div class="player-resolution">
                <strong>${submission.playerName}</strong> used their <em>${submission.item}</em> to 
                ${submission.text}
            </div>
        `;
    }

    // Add the silly resolution from the server
    resolutionHTML += `<div class="silly-resolution">${data.resolution}</div>`;

    document.getElementById('story-content').innerHTML = resolutionHTML;
    showScreen('story');

    startTimer(15, 'story-time', () => {
        // Timer completed, server will handle next phase
    });
}