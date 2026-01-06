import * as THREE from 'three';
import { Dungeon } from './dungeon.js';
import { Player } from './player.js';
import './style.css';

// Dynamic Map Import
const maps = import.meta.glob('./maps/*.txt', { query: '?raw', import: 'default', eager: true });
let currentLevel = 1;
let dungeon = null;

// Scene Setup
const scene = new THREE.Scene();
const fogColor = 0x101010;
scene.fog = new THREE.Fog(fogColor, 0, 15);
scene.background = new THREE.Color(fogColor);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 0.8, 10);
pointLight.position.set(0, 2, 0);
camera.add(pointLight);
scene.add(camera);

// Player (Initialize once)
const player = new Player(camera, document.body, null); // Dungeon passed later

function loadLevel(levelIndex) {
    // Find map file
    const mapPath = `./maps/${levelIndex}.txt`;
    const mapContent = maps[mapPath];

    if (!mapContent) {
        console.log("No more levels or map not found: " + mapPath);
        alert("You have reached the end of the dungeon!");
        return;
    }

    // Cleanup old dungeon
    if (dungeon) {
        scene.remove(dungeon.getMesh());
    }

    // Create new dungeon
    dungeon = new Dungeon(mapContent);
    scene.add(dungeon.getMesh());

    // Update player
    player.dungeon = dungeon;
    const startPos = dungeon.getStartPosition();
    camera.position.copy(startPos);

    console.log(`Level ${levelIndex} loaded.`);
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
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Loop
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    player.update(delta);

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
