import { socket } from "../socketManager.js";

export function renderWelcome(container) {
    container.classList.add("screen");
    container.innerHTML = `
        <h1>Story Sacrifice</h1>
        <p>Join with your friends. Create stories. Sacrifice the weakest!</p>

        <div id="game-creation">
            <div class="input-group">
                <input type="text" id="player-name" placeholder="Enter your name">
                <button id="create-btn">Create Game</button>
            </div>
            <div class="divider">OR</div>
            <div id="join-existing">
                <div class="input-group">
                    <input type="text" id="game-code-input" placeholder="Enter game code">
                    <button id="join-btn">Join Game</button>
                </div>
            </div>
        </div>

        <div id="game-info" style="display: none;">
            <p id="game-code-display"></p>
            <div id="share-buttons">
                <button id="copy-link">Copy Link</button>
                <button id="share-qr">Show QR Code</button>
            </div>
            <div id="qr-code"></div>
        </div>

        <div id="player-list" style="display: none;">
            <h2>Players</h2>
            <ul id="players"></ul>
        </div>

        <div id="host-controls" style="display: none;">
            <button id="start-btn">Start Game</button>
        </div>
    `;

    container.setup = function () {
        const playerNameInput = document.getElementById("player-name");
        const createBtn = document.getElementById("create-btn");
        const joinBtn = document.getElementById("join-btn");

        createBtn.onclick = () => {
            const name = playerNameInput.value.trim();
            if (!name) return alert("Enter your name");
            socket.emit("create-game", name);
        };

        joinBtn.onclick = () => {
            const code = document.getElementById("game-code-input").value.trim();
            if (!code) return alert("Enter game code");
            const name = playerNameInput.value.trim();
            if (!name) return alert("Enter your name");
            socket.emit("join-game", { gameCode: code, playerName: name });
        };

        // Socket listeners for updates
        socket.on("game-created", ({ gameCode, player }) => {
            showGameInfo(gameCode);
            updatePlayerList([player]);
            showHostControls(true);
        });

        socket.on("player-joined", (player) => {
            addPlayerToList(player);
        });

        socket.on("game-state-update", (game) => {
            updatePlayerList(game.players);
            showHostControls(game.host === socket.id);
        });

        // Start game button
        document.getElementById("start-btn").onclick = () => {
            socket.emit("start-game");
        };

        function showGameInfo(code) {
            document.getElementById("game-info").style.display = "block";
            document.getElementById("game-code-display").textContent = `Game Code: ${code}`;
        }

        function updatePlayerList(players) {
            const list = document.getElementById("players");
            list.innerHTML = "";
            players.forEach((p) => {
                const li = document.createElement("li");
                li.textContent = p.name;
                if (p.id === players[0].id) {
                    const badge = document.createElement("span");
                    badge.textContent = "HOST";
                    badge.className = "host-badge";
                    li.appendChild(badge);
                }
                list.appendChild(li);
            });
            document.getElementById("player-list").style.display = "block";
        }

        function addPlayerToList(player) {
            const list = document.getElementById("players");
            const li = document.createElement("li");
            li.textContent = player.name;
            list.appendChild(li);
            document.getElementById("player-list").style.display = "block";
        }

        function showHostControls(show) {
            document.getElementById("host-controls").style.display = show ? "block" : "none";
        }
    };
}
