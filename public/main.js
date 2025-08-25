import { showScreen } from "./screenManager.js";
import { initSocket } from "./socketManager.js";

document.addEventListener('DOMContentLoaded', () => {
    initSocket();
    showScreen("welcome");
});
