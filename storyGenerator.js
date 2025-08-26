// storyGenerator.js
const stories = [
    {
        intro: "It was a perfectly normal day when {players} decided to go on an adventure together. Little did they know, their outing would take a bizarre turn...",
        scenario: "You find yourselves trapped in a vampire's mansion! The vampire is allergic to silly things, and various items slide out of a secret passage.",
        crisis: "The vampire is getting hungry! How do you use your item to buy more time?",
        items: ["rubber chicken", "whoopee cushion", "giant foam finger", "kazoo", "silly putty", "joy buzzer", "rainbow wig", "oversized sunglasses"]
    },
    {
        intro: "{players} were just minding their own business when suddenly, adventure found them!",
        scenario: "You're being chased by a zombie horde through a shopping mall! You find a room full of unusual items.",
        crisis: "The zombies are closing in! How do you use your item to survive?",
        items: ["tennis racket", "roll of duct tape", "whoopee cushion", "rubber chicken", "super soaker", "fidget spinner", "yo-yo", "whoopee cushion"]
    },
    {
        intro: "What started as a normal day for {players} quickly spiraled into chaos...",
        scenario: "You wake up on a spaceship with a hostile alien! The only unusual items in the room are various novelty items.",
        crisis: "The alien is about to break through the door! How do you use your item to stop it?",
        items: ["whoopee cushion", "rubber chicken", "joy buzzer", "fake mustache", "rainbow wig", "giant foam finger", "kazoo", "silly string"]
    },
    {
        intro: "{players} were enjoying a peaceful picnic when suddenly...",
        scenario: "A giant mutant squirrel army is attacking the city! You find yourselves in a novelty shop with strange items.",
        crisis: "The squirrels are organizing into formation! How do you use your item to disrupt their plans?",
        items: ["squeaky toy", "bubble wand", "slinky", "magnifying glass", "whoopee cushion", "fake dog poop", "air horn", "groucho marx glasses"]
    },
    {
        intro: "During a routine office meeting, {players} suddenly found themselves in an unexpected situation...",
        scenario: "You've been transported to a dimension where everything is made of pudding! The only weapons are office supplies with strange properties.",
        crisis: "The pudding monsters are starting to melt together into a giant blob! How do you use your item to stop them?",
        items: ["stapler", "paperclip necklace", "coffee mug", "stress ball", "rubber band ball", "post-it notes", "whiteboard marker", "desktop zen garden"]
    }
];

function getRandomStory() {
    return stories[Math.floor(Math.random() * stories.length)];
}

function generatePlayerList(players) {
    const names = players.map(p => p.name);
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} and ${names[1]}`;
    return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

function generateSillyResolution(submissions, crisis) {
    const actions = Object.values(submissions).map(sub =>
        `${sub.playerName} used ${sub.item} to ${sub.text}`
    );

    const resolutions = [
        `In a stunning display of teamwork (or lack thereof), ${actions.join(', ')}. The combined effect was so absurd that it actually worked! The crisis was averted through the power of sheer ridiculousness.`,
        `Through a series of increasingly bizarre events: ${actions.join(', ')}. Miraculously, this chaotic combination somehow resolved the ${crisis.toLowerCase()}!`,
        `What followed can only be described as organized chaos: ${actions.join(', ')}. Against all odds, this ridiculous plan actually worked!`,
        `In a moment of pure insanity: ${actions.join(', ')}. Somehow, this combination of terrible ideas created a perfect solution to the ${crisis.toLowerCase()}!`,
        `Through a comedy of errors that would make a clown proud: ${actions.join(', ')}. Astonishingly, this series of mishaps somehow resolved the situation!`
    ];

    return resolutions[Math.floor(Math.random() * resolutions.length)];
}

function generateDeathMessage(playerName, submission, item) {
    const deaths = [
        `${playerName} tried to use the ${item} to ${submission}. It was so embarrassing that everyone decided it was better to continue without them.`,
        `${playerName}'s idea to ${submission} with the ${item} backfired spectacularly. The group voted unanimously to leave them behind.`,
        `When ${playerName} attempted to ${submission}, it confused everyone so much that the group decided they were better off without that kind of "help."`,
        `${playerName}'s plan to ${submission} was so bad the group decided some risks weren't worth taking. They were left behind for everyone's safety.`,
        `The ${item} seemed like a good idea to ${playerName}, but their attempt to ${submission} resulted in the group making a quick unanimous decision to continue without them.`,
        `${playerName} used the ${item} to ${submission} with such enthusiasm that they accidentally volunteered themselves as the sacrifice.`,
        `After ${playerName}'s attempt to ${submission} with the ${item}, the group decided they were clearly too powerful to keep around and had to be left behind for balance.`,
        `${playerName}'s ${submission} technique with the ${item} was so advanced that no one else could understand it. They were left behind for being too much of a genius.`
    ];
    return deaths[Math.floor(Math.random() * deaths.length)];
}

function generateContinuationStory(remainingPlayers, sacrificedPlayer, currentStory) {
    const continuations = [
        `With ${sacrificedPlayer.name} now busy exploring alternative career options, ${generatePlayerList(remainingPlayers)} pressed on with the mission. Little did they know, a new challenge awaited...`,
        `The group made the tough but necessary decision to continue without ${sacrificedPlayer.name}. ${generatePlayerList(remainingPlayers)} took a deep breath and advanced to the next challenge.`,
        `As ${sacrificedPlayer.name} became distracted by something shiny, ${generatePlayerList(remainingPlayers)} seized the opportunity to move forward. The adventure continued!`,
        `${generatePlayerList(remainingPlayers)} gave a respectful nod to ${sacrificedPlayer.name} before continuing the adventure without them. The story wasn't over yet...`,
        `With ${sacrificedPlayer.name} now pursuing their true calling as a professional potato, ${generatePlayerList(remainingPlayers)} ventured forth into the next phase of their journey.`
    ];
    return continuations[Math.floor(Math.random() * continuations.length)];
}

function generateNewCrisis(currentStory, roundNumber) {
    const crises = [
        "A new threat emerges! The situation has escalated dramatically. How do you use your item to handle this development?",
        "Just when you thought it was safe! Another problem arises that requires immediate attention. How do you use your item to address this?",
        "Plot twist! The circumstances have changed completely. How do you use your item to adapt to this new situation?",
        "Unexpected development! Things just got even more complicated. How do you use your item to navigate this turn of events?",
        "The stakes have been raised! A fresh challenge presents itself. How do you use your item to overcome this obstacle?",
        "Complication alert! The situation has evolved in unpredictable ways. How do you use your item to manage this new reality?",
        "Surprise! The adventure takes an unexpected turn. How do you use your item to deal with this revelation?",
        "The drama continues! A new crisis demands your attention. How do you use your item to resolve this issue?"
    ];

    return crises[Math.floor(Math.random() * crises.length)];
}

function generateFinalStoryEnding(winner, game) {
    const stories = [
        `After a series of increasingly absurd challenges, ${winner.name} emerged victorious! Their clever use of various items throughout the adventure proved that sometimes the weirdest ideas are the most effective.`,
        `${winner.name} stood alone at the end, having outlasted everyone else through a combination of creativity and other people's terrible decisions. The adventure was complete!`,
        `In the final moments, ${winner.name}'s persistence paid off. While others fell to their own ridiculous plans, ${winner.name} managed to navigate the chaos and emerge as the winner.`,
        `Through luck, timing, and the strategic use of questionable items, ${winner.name} proved that surviving absurdity is its own form of victory.`,
        `${winner.name} triumphed! Not through strength or wisdom, but through the ancient art of being slightly less ridiculous than everyone else.`,
        `Against all odds, ${winner.name} emerged as the sole survivor of this comedy of errors. Their prize: bragging rights and probably some therapy.`
    ];
    return stories[Math.floor(Math.random() * stories.length)];
}

function generateFullStoryRecap(game) {
    let recap = `COMPLETE ADVENTURE RECAP:\n\n`;
    recap += `Our story began: ${game.storyIntroduction}\n\n`;

    recap += `THE JOURNEY:\n`;
    game.players.forEach((player) => {
        if (game.submissions[player.id]) {
            if (player.alive) {
                recap += `- ${player.name} used ${player.currentItem} to ${game.submissions[player.id].text}\n`;
            } else {
                recap += `- ${player.name} used ${player.currentItem} to ${game.submissions[player.id].text} and was left behind\n`;
            }
        }
    });

    const winner = game.players.find(p => p.alive);
    if (winner) {
        recap += `\nFINAL OUTCOME: ${winner.name} emerged victorious!\n`;
    } else {
        recap += `\nEPILOGUE: Everyone was eliminated in this comedy of errors!\n`;
    }

    return recap;
}

function generateDisconnectMessage(playerName) {
    const messages = [
        `${playerName} spontaneously combusted due to a lack of creativity.`,
        `${playerName} was abducted by aliens who needed better story ideas.`,
        `${playerName} tripped over their own imagination and fell out of reality.`,
        `${playerName} decided to become a professional hermit instead.`,
        `${playerName} was voted off the island of creativity.`,
        `${playerName} discovered the meaning of life and decided this game wasn't it.`,
        `${playerName} was called away on urgent business - something about a missing rubber chicken.`
    ];
    return messages[Math.floor(Math.random() * messages.length)];
}

module.exports = {
    getRandomStory,
    generatePlayerList,
    generateSillyResolution,
    generateDeathMessage,
    generateContinuationStory,
    generateNewCrisis,
    generateFinalStoryEnding,
    generateFullStoryRecap,
    generateDisconnectMessage
};