export function renderLoser(container) {
    container.classList.add("screen");
    container.innerHTML = `
        <h2>Game Over</h2>
        <div id="loser-content"></div>
        <button id="spectate-btn">Spectate</button>
        <button id="leave-btn">Leave Game</button>
    `;

    container.setup = function () {
        document.getElementById("spectate-btn").onclick = () => console.log("Spectate clicked");
        document.getElementById("leave-btn").onclick = () => console.log("Leave clicked");
    };
}
