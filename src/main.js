import * as THREE from 'three';
import { Dungeon } from './dungeon.js';
import { Player } from './player.js';
import { Monster } from './monster.js';
import './style.css';

// Dynamic Map Import
const maps = import.meta.glob('./maps/*.txt', { query: '?raw', import: 'default', eager: true });
let currentLevel = 1;
let dungeon = null;
let monsters = []; // Store active monsters

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
        const hitResult = player.attack(monsters);
        if (hitResult) {
            addLog(`You hit the ${hitResult.monster.name} for ${hitResult.damage} damage!`);
            if (hitResult.monster.sprite) {
                showDamageNumber(hitResult.monster.sprite.position, hitResult.damage);
            }
            if (hitResult.isDead) {
                addLog(`The ${hitResult.monster.name} collapses into dust.`);
            }
        }
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
const player = new Player(camera, document.getElementById('game-container'), null); // Dungeon passed later

function loadLevel(levelIndex) {
    // Find map file
    const mapPath = `./maps/${levelIndex}.txt`;
    const mapContent = maps[mapPath];

    if (!mapContent) {
        console.log("No more levels or map not found: " + mapPath);
        addLog("You have reached the end of the dungeon!");
        alert("You have reached the end of the dungeon!");
        return;
    }

    // Cleanup old dungeon and monsters
    if (dungeon) {
        scene.remove(dungeon.getMesh());
    }
    monsters.forEach(m => m.remove());
    monsters = [];

    // Create new dungeon
    dungeon = new Dungeon(mapContent);
    scene.add(dungeon.getMesh());

    // Update player
    player.dungeon = dungeon;
    const startPos = dungeon.getStartPosition();
    camera.position.copy(startPos);

    // Spawn Monster in Level 1
    if (levelIndex === 1) {
        const emptySpaces = dungeon.getEmptySpaces();
        // Filter spaces at least 2 units away from start X
        const validSpaces = emptySpaces.filter(s => {
            const dist = Math.sqrt(Math.pow(s.x - startPos.x, 2) + Math.pow(s.z - startPos.z, 2));
            return dist >= 2;
        });

        if (validSpaces.length > 0) {
            const spawnSpot = validSpaces[Math.floor(Math.random() * validSpaces.length)];
            const monsterPos = new THREE.Vector3(spawnSpot.x, 0, spawnSpot.z);
            const monster = new Monster(scene, monsterPos);
            monsters.push(monster);
            addLog("A shadow moves in the distance...");
        }
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

// Loop
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    // Update monsters
    monsters.forEach(m => {
        m.update(delta);

        // Attack Player logic
        const playerPos = camera.position;
        const monsterPos = m.sprite ? m.sprite.position : null;

        if (monsterPos && playerPos.distanceTo(monsterPos) < 1.5) {
            if (m.attackCooldown <= 0) {
                const damage = m.getAttackDamage();
                player.takeDamage(damage);
                triggerBloodFlash();
                showDamageNumber(null, damage, 'player');
                m.playAttackAnimation();
                addLog(`The ${m.name} hits you for ${damage} damage!`);
                m.attackCooldown = m.maxAttackCooldown;
            }
        }
    });

    player.update(delta, monsters);

    // Update Cooldown UI
    if (cooldownOverlay) {
        const percent = (player.attackCooldown / player.maxAttackCooldown) * 100;
        cooldownOverlay.style.height = `${percent}%`;
    }

    // Cleanup dead monsters
    for (let i = monsters.length - 1; i >= 0; i--) {
        if (monsters[i].hp <= 0) {
            monsters[i].remove();
            monsters.splice(i, 1);
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
