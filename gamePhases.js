// gamePhases.js
const { getRandomStory, generateSillyResolution, generateDeathMessage, generateContinuationStory, generateNewCrisis, generateFinalStoryEnding } = require('./storyGenerator');
const { safeEmit } = require('./gameUtils');

function initGamePhases(io, games) {
    function startGame(game) {
        game.phase = 'story';
        game.roundNumber++;
        if (game.roundNumber === 1) {
            const story = getRandomStory();
            game.currentStory = story;
            game.storyIntroduction = story.intro.replace('{players}', game.players.map(p => p.name).join(', '));
        } else {
            game.currentStory.crisis = generateNewCrisis();
        }

        game.availableItems = [...game.currentStory.items];
        game.players.forEach(p => { if (p.alive) p.currentItem = game.availableItems.pop(); });

        game.submissions = {};
        game.votes = {};
        game.players.forEach(p => p.voted = false);

        game.players.forEach(p => {
            if (p.alive) io.to(p.id).emit('new-story', {
                introduction: game.roundNumber === 1 ? game.storyIntroduction : null,
                scenario: game.currentStory.scenario,
                crisis: game.currentStory.crisis,
                playerItem: p.currentItem,
                roundNumber: game.roundNumber
            });
        });

        game.timer = setTimeout(() => {
            game.phase = 'submit';
            safeEmit(game, io, 'phase-change', 'submit');
            game.timer = setTimeout(() => showStoryResolution(game), 60000);
        }, 30000);
    }

    function showStoryResolution(game) {
        game.phase = 'story-resolution';
        const resolution = generateSillyResolution(game.submissions, game.currentStory.crisis);
        safeEmit(game, io, 'story-resolution', { submissions: game.submissions, resolution });
        game.timer = setTimeout(() => startVoting(game), 20000);
    }

    function startVoting(game) {
        game.phase = 'vote';
        game.players.forEach(p => p.voted = false);
        safeEmit(game, io, 'phase-change', 'vote');
        safeEmit(game, io, 'submissions-to-vote-on', { submissions: game.submissions });
        game.timer = setTimeout(() => endVoting(game), 45000);
    }

    function endVoting(game) {
        const voteCounts = {};
        Object.values(game.votes).forEach(v => voteCounts[v] = (voteCounts[v] || 0) + 1);
        let maxVotes = 0, sacrificedId = null;
        for (const [pid, v] of Object.entries(voteCounts)) {
            if (v > maxVotes) { maxVotes = v; sacrificedId = pid; }
        }
        const sacrificed = game.players.find(p => p.id === sacrificedId);
        if (sacrificed) {
            sacrificed.alive = false;
            const deathMsg = generateDeathMessage(sacrificed.name, game.submissions[sacrificed.id]?.text, game.submissions[sacrificed.id]?.item);
            const continuation = generateContinuationStory(game.players.filter(p => p.alive), sacrificed);
            game.phase = 'result';
            safeEmit(game, io, 'player-sacrificed', { player: sacrificed, message: deathMsg, continuation });
            game.timer = setTimeout(() => {
                const alive = game.players.filter(p => p.alive);
                if (alive.length > 1) startGame(game);
                else if (alive.length === 1) endGame(game);
                else cleanupGame(game);
            }, 15000);
        }
    }

    function endGame(game) {
        const winner = game.players.find(p => p.alive);
        if (winner) {
            const story = generateFinalStoryEnding(winner);
            safeEmit(game, io, 'game-winner', { winner, story });
            cleanupGame(game);
        }
    }

    return { startGame, showStoryResolution, startVoting, endVoting, endGame };
}

module.exports = { initGamePhases };
