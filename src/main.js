import * as THREE from 'three';
import { Dungeon } from './dungeon.js';
import { Player } from './player.js';
import { Warrior } from './classes.js';
import { createItem } from './item.js';
import { ITEMS } from './itemDefinitions.js';
import { MONSTERS } from './monsterDefinitions.js';
import { setupScene } from './scene.js';
import { dungeonMusic, menuMusic, setupSoundToggle } from './audio.js';
import {
    addLog,
    showDamageNumber,
    triggerBloodFlash,
    updateCooldowns,
    initOverlayProtection,
    initTooltipTracking,
    setupCooldownOverlays
} from './ui.js';
import {
    spawnMonsters,
    handleMonsterBehavior,
    cleanupMonstersAndDropLoot,
    handleLootCollection
} from './gameLogic.js';
import { setupVendor } from './vendor.js';
import { validateAssets } from './assets.js';
import './style.css';

// --- State ---
const state = {
    currentLevel: 1,
    dungeon: null,
    monsters: [],
    loots: [],
    lastInvFullMsgTime: 0
};

// --- Initialization ---
const { scene, camera, renderer } = setupScene();
const warrior = new Warrior();
const player = new Player(camera, document.getElementById('game-container'), warrior);
player.logger = addLog;

// Initialize Portrait
const portraitImg = document.getElementById('char-portrait');
if (portraitImg) portraitImg.src = '/ui/portrait.png';

const maps = import.meta.glob('./maps/*.txt', { query: '?raw', import: 'default', eager: true });

// UI References
const { cooldownOverlay, powerCooldownOverlay } = setupCooldownOverlays();

// --- Systems Setup ---
setupSoundToggle(player, addLog);
const { openVendor } = setupVendor(player, { get value() { return state.currentLevel; } }, addLog, () => player.updateUI());
initOverlayProtection();
initTooltipTracking();
validateAssets(addLog);

// --- Functions ---
function setupRespawnButton() {
    const rawSave = localStorage.getItem('dungeon_save');
    const respawnBtn = document.getElementById('respawn-btn');
    if (!rawSave) {
        if (respawnBtn) respawnBtn.style.display = 'none';
        return;
    }

    const saveData = JSON.parse(rawSave);
    if (saveData && respawnBtn) {
        const cost = saveData.level * 25;
        respawnBtn.style.display = 'block';
        respawnBtn.innerHTML = `Respawn (${cost} G)`;

        if (saveData.gold >= cost) {
            respawnBtn.disabled = false;
            respawnBtn.style.opacity = "1";
            respawnBtn.onclick = (e) => {
                e.stopPropagation();
                saveData.gold -= cost;
                localStorage.setItem('dungeon_save', JSON.stringify(saveData));
                state.currentLevel = saveData.level;
                player.loadSaveData(saveData, ITEMS, createItem);
                player.hp = player.maxHp;
                player.updateUI();
                loadLevel(state.currentLevel);
                document.getElementById('game-over').style.display = 'none';
                addLog(`The gods demand payment... You paid ${cost} G to cheat death!`);
            };
        } else {
            respawnBtn.disabled = true;
            respawnBtn.style.opacity = "0.5";
            respawnBtn.onclick = null;
        }
    }
}

function loadLevel(levelIndex) {
    const variations = [`./maps/${levelIndex}.txt`, `maps/${levelIndex}.txt`, `/src/maps/${levelIndex}.txt`];
    let mapContent = null;
    for (const path of variations) { if (maps[path]) { mapContent = maps[path]; break; } }

    if (!mapContent) {
        localStorage.removeItem('dungeon_save');
        document.getElementById('victory').style.display = 'flex';
        player.controls.unlock();
        return;
    }

    if (state.dungeon) scene.remove(state.dungeon.getMesh());
    state.monsters.forEach(m => m.remove());
    state.monsters = [];
    state.loots.forEach(l => l.remove());
    state.loots = [];

    state.dungeon = new Dungeon(mapContent, levelIndex);
    scene.add(state.dungeon.getMesh());

    let nextFogColor = 0x101010;
    if (levelIndex >= 12) nextFogColor = 0x050510;
    scene.fog.color.setHex(nextFogColor);
    scene.background.setHex(nextFogColor);

    player.dungeon = state.dungeon;
    player.discoveredTiles.clear();
    camera.position.copy(state.dungeon.getStartPosition());

    spawnMonsters(scene, state.dungeon, levelIndex, state.monsters, addLog);

    document.getElementById('floor-val').textContent = levelIndex;
    addLog(`Entering Level ${levelIndex}...`);
}

function initSplashScreen() {
    const splash = document.getElementById('splash-screen');
    const startBtn = document.getElementById('start-game-btn');
    const spawnBtn = document.getElementById('spawn-game-btn');
    const removeBtn = document.getElementById('remove-spawn-btn');

    splash.onmousedown = (e) => e.stopPropagation();

    const tryPlayMusic = () => {
        if (!player.soundEnabled) return;
        menuMusic.play().catch(() => { });
    };

    tryPlayMusic();
    window.addEventListener('mousedown', tryPlayMusic, { once: true, capture: true });
    window.addEventListener('keydown', tryPlayMusic, { once: true, capture: true });

    const rawSave = localStorage.getItem('dungeon_save');
    if (!rawSave) {
        spawnBtn.disabled = true;
        removeBtn.disabled = true;
    } else {
        const saveData = JSON.parse(rawSave);
        const cost = (saveData.level || 1) * 25;
        spawnBtn.innerHTML = `SPAWN (${cost} G)`;
        if (saveData.gold < cost) {
            spawnBtn.disabled = true;
            spawnBtn.title = "Insufficient gold to resume";
        }
    }

    const startGame = (isResume = false) => {
        if (isResume) {
            const currentSave = JSON.parse(localStorage.getItem('dungeon_save'));
            const cost = (currentSave.level || 1) * 25;

            if (currentSave.gold < cost) {
                addLog("You don't have enough gold to bribe the Maze...");
                return;
            }

            // Deduct and save immediately
            currentSave.gold -= cost;
            localStorage.setItem('dungeon_save', JSON.stringify(currentSave));

            splash.style.display = 'none';
            document.getElementById('hud').style.display = 'flex';
            window.removeEventListener('mousedown', tryPlayMusic);
            window.removeEventListener('keydown', tryPlayMusic);
            menuMusic.pause();
            menuMusic.currentTime = 0;

            state.currentLevel = currentSave.level;
            player.loadSaveData(currentSave, ITEMS, createItem);
            player.updateUI();
            addLog(`The Maze accepts your tribute of ${cost} G.`);
            addLog(`Resuming your journey on Floor ${state.currentLevel}...`);
        } else {
            splash.style.display = 'none';
            document.getElementById('hud').style.display = 'flex';
            window.removeEventListener('mousedown', tryPlayMusic);
            window.removeEventListener('keydown', tryPlayMusic);
            menuMusic.pause();
            menuMusic.currentTime = 0;

            state.currentLevel = 1;
            addLog("Starting a new journey...");
        }

        loadLevel(state.currentLevel);
        if (player.soundEnabled) dungeonMusic.play().catch(() => { });
    };

    startBtn.onclick = () => startGame(false);
    spawnBtn.onclick = () => startGame(true);
    removeBtn.onclick = () => {
        localStorage.removeItem('dungeon_save');
        spawnBtn.disabled = true;
        removeBtn.disabled = true;
        addLog("Dungeon save wiped from existence.");
    };

    // Game Over & Victory handlers
    const newGameBtn = document.getElementById('new-game-btn');
    if (newGameBtn) {
        newGameBtn.onclick = () => {
            localStorage.removeItem('dungeon_save');
            location.reload(); // Simplest way to ensure a fresh state
        };
    }

    const playAgainBtn = document.getElementById('play-again-btn');
    if (playAgainBtn) {
        playAgainBtn.onclick = () => {
            localStorage.removeItem('dungeon_save');
            location.reload();
        };
    }
}

// --- Interaction Handlers ---
const gameContainer = document.getElementById('game-container');
gameContainer.addEventListener('mousedown', (event) => {
    if (!state.dungeon) return;
    if (!player.isLocked) { player.controls.lock(); return; }

    if (event.button === 0) {
        const hits = player.attack(state.monsters);
        hits.forEach(hitResult => {
            addLog(`You hit the ${hitResult.monster.name} for ${hitResult.damage} damage!`);
            if (hitResult.monster.sprite) showDamageNumber(hitResult.monster.sprite.position, camera, hitResult.damage);
        });
    } else if (event.button === 2) {
        const hits = player.powerAttack(state.monsters);
        hits.forEach(hitResult => {
            addLog(`POWER ATTACK! You smash the ${hitResult.monster.name} for ${hitResult.damage} damage!`);
            if (hitResult.monster.sprite) showDamageNumber(hitResult.monster.sprite.position, camera, hitResult.damage, 'heavy');
        });
    }
});

gameContainer.addEventListener('contextmenu', (e) => e.preventDefault());

window.addEventListener('keydown', (e) => {
    if ((e.key === '²' || e.code === 'Backquote') && player.isGodMode) {
        const cmd = prompt("GOD CONSOLE: Enter command (e.g. 'level 5')");
        if (cmd) {
            const match = cmd.match(/level\s+(\d+)/i);
            if (match) {
                state.currentLevel = parseInt(match[1]);
                loadLevel(state.currentLevel);
            }
        }
    }
    if (e.code === 'KeyT' && player.hp > 0) openVendor();
});

// --- Inventory Click Handlers ---
document.querySelectorAll('.backpack-slot').forEach((slot, index) => {
    slot.addEventListener('click', (event) => {
        event.stopPropagation();
        const item = player.inventory[index];
        if (item) {
            if (item.type === 'consumable' || item.itemClass === 'Potion') {
                const result = player.useItem(item, index, state.monsters);
                if (result.message) addLog(result.message);
            } else {
                player.equip(item, index);
                addLog(`Equipped ${item.name}`);
            }
        }
    });
});

document.querySelectorAll('#equipment .slot').forEach(slot => {
    slot.addEventListener('click', (event) => {
        event.stopPropagation();
        const slotId = slot.id.replace('slot-', '');
        const item = player.equipment[slotId];
        if (item) {
            player.unequip(slotId);
            addLog(`Unequipped ${item.name}`);
        }
    });
});

// --- UI Focus Logic ---
const instructions = document.getElementById('instructions');
player.controls.addEventListener('lock', () => {
    if (instructions) instructions.style.display = 'none';
});
player.controls.addEventListener('unlock', () => {
    // Don't show instructions if quest/map overlays are open (they handle their own visibility)
    if (instructions && !player.isMapOpen && document.getElementById('vendor-overlay').style.display !== 'flex') {
        instructions.style.display = 'block';
    }
});

// --- Main Loop ---
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    if (!state.dungeon) { renderer.render(scene, camera); return; }

    if (player.hp <= 0) {
        document.getElementById('game-over').style.display = 'flex';
        setupRespawnButton();
        player.controls.unlock();
        renderer.render(scene, camera);
        return;
    }

    if (player.isLocked) {
        handleMonsterBehavior(delta, state.monsters, player, camera, state.dungeon, addLog, triggerBloodFlash, showDamageNumber);
        updateCooldowns(player, cooldownOverlay, powerCooldownOverlay);
        cleanupMonstersAndDropLoot(state.monsters, scene, state.loots, player, addLog, state.dungeon);
        const invFullWrapper = { get value() { return state.lastInvFullMsgTime; }, set value(v) { state.lastInvFullMsgTime = v; } };
        handleLootCollection(state.loots, player, camera, addLog, invFullWrapper);

        // Exit Check
        const exitTrigger = state.dungeon.getExit();
        const bossExitTrigger = state.dungeon.getBossExitTrigger();
        const bossExitMesh = state.dungeon.getBossExitMesh();
        if ((exitTrigger && exitTrigger.containsPoint(camera.position)) ||
            (bossExitTrigger && bossExitMesh?.visible && bossExitTrigger.containsPoint(camera.position))) {
            state.currentLevel++;
            localStorage.setItem('dungeon_save', JSON.stringify(player.getSaveData(state.currentLevel)));
            addLog("Game Progress Saved.");
            loadLevel(state.currentLevel);
        }
    }

    player.update(delta, state.monsters);
    renderer.render(scene, camera);
}

// Start
initSplashScreen();
animate();
