import { renderWelcome } from "./screens/welcome.js";
import { renderStory } from "./screens/story.js";
import { renderSubmit } from "./screens/submit.js";
import { renderVote } from "./screens/vote.js";
import { renderResult } from "./screens/result.js";
import { renderWinner } from "./screens/winner.js";
import { renderLoser } from "./screens/loser.js";

const screens = {
    welcome: renderWelcome,
    story: renderStory,
    submit: renderSubmit,
    vote: renderVote,
    result: renderResult,
    winner: renderWinner,
    loser: renderLoser,
};

export function showScreen(name, state = {}) {
    const container = document.getElementById("game-container");
    container.innerHTML = "";
    container.classList.add("screen", "active"); // <-- ensure it's visible
    if (screens[name]) {
        screens[name](container, state); // renders content
        if (typeof container.setup === "function") container.setup(state); // auto-call setup
    } else {
        container.innerHTML = `<p>Unknown screen: ${name}</p>`;
    }
}
