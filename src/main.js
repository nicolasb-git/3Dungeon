import * as THREE from 'three';
import { Dungeon } from './dungeon.js';
import { Player } from './player.js';
import { Monster } from './monster.js';
import { Loot } from './loot.js';
import { Warrior } from './classes.js';
import { Armor } from './item.js';
import './style.css';

// Dynamic Map Import
const maps = import.meta.glob('./maps/*.txt', { query: '?raw', import: 'default', eager: true });
let currentLevel = 1;
let dungeon = null;
let monsters = []; // Store active monsters
let loots = []; // Store active loot

// Scene Setup
const scene = new THREE.Scene();
const fogColor = 0x101010;
scene.fog = new THREE.Fog(fogColor, 0, 15);
scene.background = new THREE.Color(fogColor);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight * 0.8);
document.getElementById('game-container').appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 0.8, 10);
pointLight.position.set(0, 2, 0);
camera.add(pointLight);
scene.add(camera);

// Remove old listener from player.js if it exists (actually we should remove it from there directly but let's override here)
// Wait, player.js has its own listener. I should probably modify it there or handle it here.
// Let's modify player.js to NOT have the listener and handle it all in main.js.
const portraitImg = document.getElementById('char-portrait');
const logEl = document.getElementById('log');

// Click Handler
window.addEventListener('click', () => {
    if (!player.isLocked) {
        player.controls.lock();
    } else {
        const hits = player.attack(monsters);
        hits.forEach(hitResult => {
            addLog(`You hit the ${hitResult.monster.name} for ${hitResult.damage} damage (${hitResult.baseDamage} + ${hitResult.str} STR)!`);
            if (hitResult.monster.sprite) {
                showDamageNumber(hitResult.monster.sprite.position, hitResult.damage);
            }
            if (hitResult.isDead) {
                addLog(`The ${hitResult.monster.name} collapses into dust.`);
            }
        });
    }
});

portraitImg.src = '/portrait.png';

// Initial Equipment
const swordSlot = document.getElementById('slot-r-hand');
let cooldownOverlay = null;

if (swordSlot) {
    swordSlot.classList.add('equipped');
    swordSlot.style.backgroundImage = "url('/sword_icon.png')";

    cooldownOverlay = document.createElement('div');
    cooldownOverlay.className = 'cooldown-overlay';
    swordSlot.appendChild(cooldownOverlay);
}

function addLog(message) {
    const entry = document.createElement('div');
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logEl.appendChild(entry);

    const container = document.getElementById('log-container');
    if (container) {
        container.scrollTop = container.scrollHeight;
    }
}

function showDamageNumber(worldPosition, amount, className = '') {
    let x, y;

    if (worldPosition) {
        const vector = worldPosition.clone().project(camera);
        x = (vector.x + 1) / 2 * window.innerWidth;
        y = -(vector.y - 1) / 2 * (window.innerHeight * 0.8);
    } else {
        // Default to center if no position provided (e.g. for player hits)
        x = window.innerWidth / 2 + (Math.random() - 0.5) * 100;
        y = (window.innerHeight * 0.8) / 2 + (Math.random() - 0.5) * 100;
    }

    const el = document.createElement('div');
    el.className = `damage-number ${className}`;
    el.textContent = amount;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    document.getElementById('damage-numbers').appendChild(el);
    setTimeout(() => el.remove(), 1000);
}

function triggerBloodFlash() {
    const flash = document.getElementById('blood-flash');
    if (!flash) return;
    flash.classList.remove('active');
    void flash.offsetWidth; // Trigger reflow
    flash.classList.add('active');
}

// Player (Initialize once)
const warrior = new Warrior();
const player = new Player(camera, document.getElementById('game-container'), warrior);
player.updateUI();

function loadLevel(levelIndex) {
    // Find map file
    const mapPath = `./maps/${levelIndex}.txt`;
    const mapContent = maps[mapPath];

    if (!mapContent) {
        console.log("No more levels or map not found: " + mapPath);
        document.getElementById('victory').style.display = 'flex';
        player.controls.unlock();
        return;
    }

    // Cleanup old dungeon and monsters
    if (dungeon) {
        scene.remove(dungeon.getMesh());
    }
    monsters.forEach(m => m.remove());
    monsters = [];
    loots.forEach(l => l.remove());
    loots = [];

    // Create new dungeon
    dungeon = new Dungeon(mapContent);
    scene.add(dungeon.getMesh());

    // Update player
    player.dungeon = dungeon;
    const startPos = dungeon.getStartPosition();
    camera.position.copy(startPos);

    // Spawn Monsters
    const numMonsters = 1 + levelIndex;
    const emptySpaces = dungeon.getEmptySpaces();
    const validSpaces = emptySpaces.filter(s => {
        const dist = Math.sqrt(Math.pow(s.x - startPos.x, 2) + Math.pow(s.z - startPos.z, 2));
        return dist >= 3;
    });

    for (let i = 0; i < numMonsters && validSpaces.length > 0; i++) {
        const rndIdx = Math.floor(Math.random() * validSpaces.length);
        const spot = validSpaces.splice(rndIdx, 1)[0];
        const monsterPos = new THREE.Vector3(spot.x, 0, spot.z);

        // Decide type
        let type = 'shadow';
        if (levelIndex > 1) {
            // Level 2: 50/50, Level 3+: more skeletons
            const skeletonChance = levelIndex === 2 ? 0.5 : 0.7;
            if (Math.random() < skeletonChance) {
                type = 'skeleton';
            }
        }

        const monster = new Monster(scene, monsterPos, type);
        // Buff monsters based on level
        monster.maxHp += (levelIndex - 1) * 20;
        monster.hp = monster.maxHp;
        monster.attackDamage.min += (levelIndex - 1) * 2;
        monster.attackDamage.max += (levelIndex - 1) * 3;
        monsters.push(monster);
    }

    if (monsters.length > 0) {
        addLog(`${monsters.length} shadows move in the distance...`);
    }

    console.log(`Level ${levelIndex} loaded.`);
    addLog(`Entering Level ${levelIndex}...`);
}

// Initial Load
loadLevel(currentLevel);

// UI Logic
const instructions = document.getElementById('instructions');
player.controls.addEventListener('lock', () => {
    instructions.style.display = 'none';
});
player.controls.addEventListener('unlock', () => {
    instructions.style.display = 'block';
});

// Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / (window.innerHeight * 0.8);
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight * 0.8);
});

// Inventory Click Handlers
document.querySelectorAll('.backpack-slot').forEach((slot, index) => {
    slot.addEventListener('click', () => {
        const item = player.inventory[index];
        if (item) {
            player.equip(item, index);
            addLog(`Equipped ${item.name}`);
        }
    });
});

// Equipment Click Handlers
document.querySelectorAll('#equipment .slot').forEach(slot => {
    slot.addEventListener('click', () => {
        const slotId = slot.id.replace('slot-', '');
        const item = player.equipment[slotId];
        if (item) {
            player.unequip(slotId);
            addLog(`Unequipped ${item.name}`);
        }
    });
});

// Loop
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    if (player.hp <= 0) {
        document.getElementById('game-over').style.display = 'flex';
        player.controls.unlock();
        return;
    }

    // Update monsters
    monsters.forEach(m => {
        m.update(delta);

        // Attack/Chase Player logic
        const playerPos = camera.position;
        const monsterPos = m.sprite ? m.sprite.position : null;

        if (monsterPos) {
            const dist = playerPos.distanceTo(monsterPos);

            // Initial spot check
            if (!m.spottedPlayer && m.hasLineOfSight(playerPos, dungeon.getWalls()) && dist < 10) {
                m.spottedPlayer = true;
                addLog(`The ${m.name} has spotted you!`);
            }

            if (m.spottedPlayer) {
                if (dist < 1.0) {
                    // Attack range
                    if (m.attackCooldown <= 0) {
                        const baseDamage = m.getAttackDamage();
                        const result = player.takeDamage(baseDamage);
                        player._playScratchSound();
                        triggerBloodFlash();
                        showDamageNumber(null, result.actualDamage, 'player');
                        m.playAttackAnimation();
                        addLog(`The ${m.name} hits you for ${result.actualDamage} damage (${result.baseDamage} - ${result.def} DEF)!`);
                        m.attackCooldown = m.maxAttackCooldown;
                    }
                } else {
                    // Move towards player (persistent even if LOS is lost)
                    m.moveTowards(playerPos, delta, dungeon.getWalls());
                }
            }
        }
    });

    player.update(delta, monsters);

    // Update Cooldown UI
    if (cooldownOverlay) {
        const percent = (player.attackCooldown / player.maxAttackCooldown) * 100;
        cooldownOverlay.style.height = `${percent}%`;
    }

    // Cleanup dead monsters and drop loot
    for (let i = monsters.length - 1; i >= 0; i--) {
        if (monsters[i].hp <= 0) {
            const pos = monsters[i].sprite.position.clone();

            // Random Drop: 30% chance of armor, else gold
            if (Math.random() < 0.3) {
                const tunic = new Armor("Leather Tunic", "torso", 5, "/tunic_icon.png");
                loots.push(new Loot(scene, pos, 0, tunic));
                addLog(`The ${monsters[i].name} dropped a Leather Tunic!`);
            } else {
                const goldAmount = Math.floor(Math.random() * 11) + 10; // 10-20 gold
                loots.push(new Loot(scene, pos, goldAmount));
            }

            if (player.addXP(25)) {
                addLog("LEVEL UP! You feel more powerful!");
            }
            monsters[i].remove();
            monsters.splice(i, 1);
        }
    }

    // Update Loots / Pickups
    const playerBox = new THREE.Box3().setFromCenterAndSize(
        camera.position,
        new THREE.Vector3(0.5, 1.8, 0.5)
    );

    for (let i = loots.length - 1; i >= 0; i--) {
        if (playerBox.intersectsBox(loots[i].getBoundingBox())) {
            if (loots[i].item) {
                if (player.addItem(loots[i].item)) {
                    addLog(`You picked up: ${loots[i].item.name}`);
                    loots[i].remove();
                    loots.splice(i, 1);
                }
            } else {
                const amount = loots[i].amount;
                player.addGold(amount);
                addLog(`You picked up ${amount} gold coins!`);
                loots[i].remove();
                loots.splice(i, 1);
            }
        }
    }

    // Check Level Exit
    if (dungeon && dungeon.getExit()) {
        const playerPos = camera.position;
        if (dungeon.getExit().containsPoint(playerPos)) {
            currentLevel++;
            loadLevel(currentLevel);
        }
    }

    renderer.render(scene, camera);
}

animate();
