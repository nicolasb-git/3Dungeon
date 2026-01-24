// Music Management
export const dungeonMusic = new Audio('/audio/dungeon_loop.wav');
dungeonMusic.loop = true;
dungeonMusic.volume = 0.24;
dungeonMusic.addEventListener('error', (e) => console.error("Dungeon Music Load Error:", e));

export const menuMusic = new Audio('/audio/ambient.wav');
menuMusic.loop = true;
menuMusic.volume = 0.5;
menuMusic.addEventListener('error', (e) => console.error("Menu Music Load Error:", e));

export function setupSoundToggle(player, addLogCallback) {
    const soundBtn = document.getElementById('sound-toggle');
    if (!soundBtn) return;

    soundBtn.addEventListener('mousedown', (event) => {
        event.stopPropagation();
    });

    soundBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        player.soundEnabled = !player.soundEnabled;
        console.log("Sound Toggle Clicked - Enabled:", player.soundEnabled);

        soundBtn.textContent = player.soundEnabled ? '🔊' : '🔇';
        soundBtn.classList.toggle('muted', !player.soundEnabled);

        // Control Music
        const isMuted = !player.soundEnabled;
        dungeonMusic.muted = isMuted;
        menuMusic.muted = isMuted;

        // Also force volume to 0 to be absolutely sure
        dungeonMusic.volume = isMuted ? 0 : 0.24;
        menuMusic.volume = isMuted ? 0 : 0.5;

        if (isMuted) {
            dungeonMusic.pause();
            menuMusic.pause();
            console.log("Background music paused and volume cleared.");
        } else {
            console.log("Background music resuming...");
            // Only resume if player is not in a dungeon (menuMusic) or if they are (dungeonMusic)
            // But this function doesn't know the state. We'll handle state-based play in main.
            // For now, let's just emit the log.
        }

        if (addLogCallback) {
            addLogCallback(`Sound ${player.soundEnabled ? 'Enabled' : 'Disabled'}`);
        }
    });
}
