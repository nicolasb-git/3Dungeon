import * as THREE from 'three';
import { Dungeon } from './dungeon.js';
import { Player } from './player.js';
import { Monster } from './monster.js';
import { Loot } from './loot.js';
import { Warrior } from './classes.js';
import { Armor, Item, createItem } from './item.js';
import { ITEMS } from './itemDefinitions.js';
import { MONSTERS } from './monsterDefinitions.js';
import { LOOT_CONFIG } from './lootConfig.js';
import { STATUSES } from './statusDefinitions.js';
import './style.css';

// Dynamic Map Import
const maps = import.meta.glob('./maps/*.txt', { query: '?raw', import: 'default', eager: true });
let currentLevel = 1;
let dungeon = null;
let monsters = []; // Store active monsters
let loots = []; // Store active loot
let lastInvFullMsgTime = 0; // Throttle for inventory full messages

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
const gameContainer = document.getElementById('game-container');
gameContainer.addEventListener('click', (event) => {
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
player.logger = addLog;
document.getElementById('floor-val').textContent = currentLevel;
player.updateUI();

async function checkAssetExists(path) {
    try {
        const response = await fetch(path, { method: 'HEAD' });
        return response.ok;
    } catch (e) {
        return false;
    }
}

async function validateAssets() {
    console.log("Starting asset and logic validation...");

    // 1. Loot Logic Validation
    const monsterKeys = Object.keys(MONSTERS);
    const missingLoot = monsterKeys.filter(mId => !LOOT_CONFIG[mId]);
    if (missingLoot.length > 0) {
        console.error("CRITICAL: Missing loot definitions for:", missingLoot.join(", "));
        addLog(`WARNING: Loot table missing for: ${missingLoot.join(", ")}`);
    }

    // 2. Asset Path Validation
    const assetChecks = [];

    // Check Monsters
    monsterKeys.forEach(mId => {
        const m = MONSTERS[mId];
        assetChecks.push({ id: `Monster:${mId}:idle`, path: m.texturePaths.idle });
        assetChecks.push({ id: `Monster:${mId}:attack`, path: m.texturePaths.attack });
    });

    // Check Items
    Object.keys(ITEMS).forEach(itemId => {
        const item = ITEMS[itemId];
        assetChecks.push({ id: `Item:${itemId}`, path: item.icon });
    });

    const results = await Promise.all(assetChecks.map(async check => ({
        ...check,
        exists: await checkAssetExists(check.path)
    })));

    const brokenAssets = results.filter(r => !r.exists);
    if (brokenAssets.length > 0) {
        const msg = brokenAssets.map(r => `${r.id} (${r.path})`).join(", ");
        console.error("CRITICAL: Broken asset paths detected:", msg);
        addLog(`WARNING: Some textures are missing: ${brokenAssets.length} broken paths.`);
    } else {
        console.log("All assets and loot definitions validated successfully.");
    }
}

validateAssets();

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

        // Decide type (Weighted Random)
        const available = Object.entries(MONSTERS)
            .filter(([_, config]) => levelIndex >= (config.startLevel || 1))
            .map(([id, config]) => ({ id, weight: config.spawnWeight || 1 }));

        const totalWeight = available.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.random() * totalWeight;
        let type = available[0].id;

        for (const item of available) {
            if (random < item.weight) {
                type = item.id;
                break;
            }
            random -= item.weight;
        }

        if (type === 'knight_skeleton') {
            addLog(`A powerful presence emerges... a Skeletal Knight!`);
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
    document.getElementById('floor-val').textContent = levelIndex;
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

// Sound Toggle
const soundBtn = document.getElementById('sound-toggle');
if (soundBtn) {
    soundBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        player.soundEnabled = !player.soundEnabled;
        soundBtn.textContent = player.soundEnabled ? '🔊' : '🔇';
        soundBtn.classList.toggle('muted', !player.soundEnabled);
        addLog(`Sound ${player.soundEnabled ? 'Enabled' : 'Disabled'}`);
    });
}

// God Console
window.addEventListener('keydown', (e) => {
    if ((e.key === '²' || e.code === 'Backquote') && player.isGodMode) {
        const cmd = prompt("GOD CONSOLE: Enter command (e.g. 'level 5')");
        if (cmd) {
            const match = cmd.match(/level\s+(\d+)/i);
            if (match) {
                const target = parseInt(match[1]);
                if (target > 0) {
                    addLog(`Teleporting to Level ${target}...`);
                    currentLevel = target;
                    loadLevel(currentLevel);
                } else {
                    addLog("Invalid Level Number.");
                }
            }
        }
    }
});

// Vendor System
const teleportBtn = document.getElementById('teleport-btn');
const vendorOverlay = document.getElementById('vendor-overlay');
const closeVendorBtn = document.getElementById('close-vendor');
const shopListEl = document.getElementById('shop-list');
const sellListEl = document.getElementById('sell-list');

function openVendor() {
    if (player.hp <= 0) return;
    vendorOverlay.style.display = 'flex';
    player.controls.unlock();
    renderVendorInventories();
    addLog("You teleport to the Sly Vendor...");
}

function closeVendor() {
    vendorOverlay.style.display = 'none';
    player._hideTooltip();
    addLog("Returning to the dungeon...");
}

function renderVendorInventories() {
    // Clear lists
    shopListEl.innerHTML = '';
    sellListEl.innerHTML = '';

    // Shop Items (All items from ITEMS registry)
    Object.values(ITEMS).forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'vendor-item';
        itemDiv.innerHTML = `
            <img src="${item.icon}" alt="${item.name}">
            <div class="item-name">${item.name}</div>
            <div class="item-price">${item.price} G</div>
        `;
        itemDiv.onclick = (event) => {
            event.stopPropagation();
            if (player.gold >= item.price) {
                const newItem = createItem(item);
                if (newItem && player.addItem(newItem)) {
                    player.gold -= item.price;
                    player._hideTooltip();
                    updateHUD();
                    renderVendorInventories();
                    addLog(`Bought ${item.name} for ${item.price} gold.`);
                } else if (!newItem) {
                    addLog("Error creating item!");
                } else {
                    addLog("Backpack is full!");
                }
            } else {
                addLog("Not enough gold!");
            }
        };

        itemDiv.onmouseenter = () => player._showTooltip(item);
        itemDiv.onmouseleave = () => player._hideTooltip();

        shopListEl.appendChild(itemDiv);
    });

    // Sell Items (Player's inventory)
    player.inventory.forEach((item, index) => {
        if (!item) return;
        const itemDiv = document.createElement('div');
        itemDiv.className = 'vendor-item';
        const sellPrice = Math.floor(item.price * 0.5); // Sell for 50%
        itemDiv.innerHTML = `
            <img src="${item.icon}" alt="${item.name}">
            <div class="item-name">${item.name}</div>
            <div class="item-price">${sellPrice} G</div>
        `;
        itemDiv.onclick = (event) => {
            event.stopPropagation();
            player.gold += sellPrice;
            player.inventory.splice(index, 1);
            player._hideTooltip(); // Hide tooltip after selling
            updateHUD();
            renderVendorInventories();
            addLog(`Sold ${item.name} for ${sellPrice} gold.`);
        };

        itemDiv.onmouseenter = () => player._showTooltip(item);
        itemDiv.onmouseleave = () => player._hideTooltip();

        sellListEl.appendChild(itemDiv);
    });
}

function updateHUD() {
    player.updateUI();
}

if (teleportBtn) {
    teleportBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        openVendor();
    });
}

if (vendorOverlay) {
    vendorOverlay.addEventListener('click', (event) => {
        event.stopPropagation();
    });
}

if (closeVendorBtn) {
    closeVendorBtn.addEventListener('click', () => {
        closeVendor();
    });
}

// Inventory Click Handlers
document.querySelectorAll('.backpack-slot').forEach((slot, index) => {
    slot.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent triggering an attack click
        const item = player.inventory[index];
        if (item) {
            if (item.type === 'consumable') {
                const result = player.useItem(item, index, monsters);
                if (result.success) {
                    addLog(result.message);
                } else if (result.message) {
                    addLog(result.message);
                }
            } else {
                player.equip(item, index);
                addLog(`Equipped ${item.name}`);
            }
        }
    });
});

// Equipment Click Handlers
document.querySelectorAll('#equipment .slot').forEach(slot => {
    slot.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent triggering an attack click
        const slotId = slot.id.replace('slot-', '');
        const item = player.equipment[slotId];
        if (item) {
            player.unequip(slotId);
            addLog(`Unequipped ${item.name}`);
        }
    });
});

// Mouse Tracking for Tooltips
window.mouseX = 0;
window.mouseY = 0;

window.addEventListener('mousemove', (e) => {
    window.mouseX = e.clientX;
    window.mouseY = e.clientY;

    const tooltip = document.getElementById('tooltip');
    if (tooltip) {
        const x = window.mouseX + 15;
        const y = window.mouseY + 15;

        // Keep tooltip inside window boundaries
        const width = tooltip.offsetWidth;
        const height = tooltip.offsetHeight;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        let finalX = x;
        let finalY = y;

        if (x + width > windowWidth) finalX = window.mouseX - width - 15;
        if (y + height > windowHeight) finalY = window.mouseY - height - 15;

        tooltip.style.left = `${finalX}px`;
        tooltip.style.top = `${finalY}px`;
    }
});

// Loop
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    if (player.hp <= 0) {
        document.getElementById('game-over').style.display = 'flex';
        player.controls.unlock();
        renderer.render(scene, camera);
        return;
    }

    if (player.isLocked) {
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

                            // Apply plague if monster has the chance
                            const monsterConfig = MONSTERS[m.type];
                            if (monsterConfig && monsterConfig.plagueChance && Math.random() < monsterConfig.plagueChance) {
                                player.applyStatus(STATUSES.plague);
                                addLog("You have been infected with the Plague!");
                            }

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

                const lootResults = monsters[i].getLoot();
                lootResults.forEach(lootData => {
                    if (lootData.type === 'gold') {
                        loots.push(new Loot(scene, pos, lootData.amount));
                    } else if (lootData.type === 'item') {
                        loots.push(new Loot(scene, pos, 0, lootData.item));
                        addLog(`The ${monsters[i].name} dropped a ${lootData.item.name}!`);
                    }
                });

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
                    // Check if inventory is full before trying to pick up
                    if (player.inventory.length >= player.maxInventory) {
                        const now = Date.now();
                        if (now - lastInvFullMsgTime > 3000) {
                            addLog("Your backpack is full! Free some space to pick up the item.");
                            lastInvFullMsgTime = now;
                        }
                        // Item stays on floor (not removed from loots, not removed from scene)
                    } else {
                        const itemToPick = loots[i].item;
                        if (player.addItem(itemToPick)) {
                            player._hideTooltip();
                            addLog(`You picked up: ${itemToPick.name}`);
                            loots[i].remove();
                            loots.splice(i, 1);
                        }
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
    }

    renderer.render(scene, camera);
}

animate();
