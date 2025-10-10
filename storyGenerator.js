// storyGenerator.js
const { stories, NARRATIVE_TEMPLATES } = require('./storyData');

function getRandomStory() {
    return stories[Math.floor(Math.random() * stories.length)];
}

function generateSillyResolution(submissions, crisis) {
    const actions = Object.values(submissions)
        .map(s => `${s.playerName} used ${s.item} to ${s.text}`)
        .join(', ');
    const generator = NARRATIVE_TEMPLATES.resolutions[
        Math.floor(Math.random() * NARRATIVE_TEMPLATES.resolutions.length)
    ];
    return generator(actions, crisis);
}

function generateDeathMessage(playerName, submission, item) {
    const generator = NARRATIVE_TEMPLATES.deaths[
        Math.floor(Math.random() * NARRATIVE_TEMPLATES.deaths.length)
    ];
    return generator(playerName, submission, item);
}

function generateContinuationStory(remainingPlayers, sacrificedPlayer) {
    const generator = NARRATIVE_TEMPLATES.continuations[
        Math.floor(Math.random() * NARRATIVE_TEMPLATES.continuations.length)
    ];
    return generator(remainingPlayers, sacrificedPlayer);
}

function generateNewCrisis() {
    return NARRATIVE_TEMPLATES.crises[
        Math.floor(Math.random() * NARRATIVE_TEMPLATES.crises.length)
    ];
}

function generateFinalStoryEnding(winner) {
    const generator = NARRATIVE_TEMPLATES.endings[
        Math.floor(Math.random() * NARRATIVE_TEMPLATES.endings.length)
    ];
    return generator(winner);
}

function generateDisconnectMessage(playerName) {
    const generator = NARRATIVE_TEMPLATES.disconnects[
        Math.floor(Math.random() * NARRATIVE_TEMPLATES.disconnects.length)
    ];
    return generator(playerName);
}

module.exports = {
    getRandomStory,
    generateSillyResolution,
    generateDeathMessage,
    generateContinuationStory,
    generateNewCrisis,
    generateFinalStoryEnding,
    generateDisconnectMessage
};
