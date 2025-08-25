// Spectate button
const spectateBtn = document.getElementById('spectate-btn');
if (spectateBtn) {
    spectateBtn.addEventListener('click', () => {
        // Implement spectate functionality
        alert('Spectate mode activated');
    });
}

// Leave game button
const leaveBtn = document.getElementById('leave-btn');
if (leaveBtn) {
    leaveBtn.addEventListener('click', () => {
        location.reload();
    });
}