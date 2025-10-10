function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function countVotes(votes) {
    const counts = {};
    Object.values(votes).forEach(v => counts[v] = (counts[v] || 0) + 1);
    return counts;
}

function safeEmit(game, io, event, data) {
    if (game.phase !== 'ended') io.to(game.id).emit(event, data);
}

function cleanupGame(game) {
    if (game.timer) clearTimeout(game.timer);
    game.phase = 'ended';
}

function generatePlayerList(players) {
    const names = players.map(p => p.name);
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} and ${names[1]}`;
    return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

function findGameBySocket(games, socketId) {
    for (const game of games.values()) {
        if (game.players.some(p => p.id === socketId)) return game;
    }
    return null;
}

module.exports = { shuffleArray, countVotes, safeEmit, cleanupGame, generatePlayerList, findGameBySocket };
