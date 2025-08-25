export function renderWinner(container) {
    container.classList.add("screen");
    container.innerHTML = `
        <h2>Game Over</h2>
        <div id="winner-content"></div>
        <button id="play-again">Play Again</button>
    `;

    container.setup = function () {
        document.getElementById("play-again").onclick = () => {
            console.log("Play again clicked");
        };
    };
}
