// storyData.js

const STORY_TEMPLATES = {
    VAMPIRE_MANSION: {
        intro: "It was a perfectly normal day when {players} decided to go on an adventure together...",
        scenario: "You find yourselves trapped in a vampire's mansion!",
        crisis: "The vampire is getting hungry! How do you use your item to buy more time?",
        items: ["rubber chicken", "whoopee cushion", "giant foam finger", "kazoo"]
    },
    ZOMBIE_MALL: {
        intro: "{players} were just minding their own business when suddenly, adventure found them!",
        scenario: "You're being chased by a zombie horde through a shopping mall!",
        crisis: "The zombies are closing in! How do you use your item to survive?",
        items: ["tennis racket", "duct tape", "super soaker", "fidget spinner"]
    }
};

const NARRATIVE_TEMPLATES = {
    resolutions: [
        (actions, crisis) => `In a stunning display, ${actions}. Crisis: ${crisis} resolved absurdly!`
    ],
    deaths: [
        (playerName, submission, item) => `${playerName} tried ${submission} with ${item} and failed.`
    ],
    continuations: [
        (remainingPlayers, sacrificedPlayer) => `${sacrificedPlayer.name} was eliminated. ${remainingPlayers.map(p => p.name).join(', ')} continue!`
    ],
    crises: ["A new threat emerges! How do you use your item to handle it?"],
    endings: [
        (winner) => `${winner.name} survived the absurd adventure and wins!`
    ],
    disconnects: [
        (playerName) => `${playerName} disconnected and is out of the game.`
    ]
};

const stories = Object.values(STORY_TEMPLATES);

function generatePlayerList(players) {
    const names = players.map(p => p.name);
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} and ${names[1]}`;
    return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

module.exports = { STORY_TEMPLATES, NARRATIVE_TEMPLATES, stories, generatePlayerList };
