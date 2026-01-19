import * as THREE from 'three';

import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { Weapon } from './weapon.js';
import { STATUSES } from './statusDefinitions.js';

export class Player {
    constructor(camera, domElement, characterClass) {
        this.camera = camera;
        this.controls = new PointerLockControls(camera, domElement);
        this.charClass = characterClass;

        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.isLocked = false;
        this.speed = 5.0; // Movement speed
        this.isGodMode = false;
        this.isMapOpen = false;

        // Initialize stats from character class
        this.hp = characterClass.hp;
        this.maxHp = characterClass.hp;
        this.str = characterClass.str;
        this.def = characterClass.def;
        this.gold = 0;
        this.xp = 0;
        this.weapon = characterClass.weapon;
        this.level = 1;
        this.xpToNextLevel = 100;

        // Inventory & Equipment
        this.inventory = [];
        this.maxInventory = 10;
        this.equipment = {
            head: null,
            torso: null,
            legs: null,
            boots: null,
            'l-hand': null,
            'r-hand': characterClass.weapon // Warrior starts with weapon in right hand
        };

        // Slash Effect
        const loader = new THREE.TextureLoader();
        const slashTexture = loader.load('/slash.png');
        const slashMaterial = new THREE.SpriteMaterial({
            map: slashTexture,
            transparent: true,
            blending: THREE.AdditiveBlending,
            opacity: 0,
            depthTest: false // Ensure it's always on top
        });
        this.slashSprite = new THREE.Sprite(slashMaterial);
        this.slashSprite.visible = false;
        this.slashSprite.position.set(0, 0, -0.5); // Very close to camera
        this.slashSprite.scale.set(0.5, 0.5, 1);
        this.camera.add(this.slashSprite);

        this.slashTimer = 0;
        this.attackCooldown = 0;
        this.maxAttackCooldown = characterClass.weapon.cooldown;
        this.audioCtx = null;
        this.soundEnabled = true;

        this.statuses = [];
        this.logger = null; // Callback for addLog
        this.discoveredTiles = new Set(); // Stores "x,z" strings
        this._initListeners(domElement);
    }

    _initListeners(domElement) {
        this.controls.addEventListener('lock', () => {
            this.isLocked = true;
        });

        this.controls.addEventListener('unlock', () => {
            this.isLocked = false;
        });

        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;

        const onKeyDown = (event) => {
            const key = event.key ? event.key.toLowerCase() : '';
            const code = event.code;

            // Debug detection
            if (key === 'm' || code === 'KeyM') {
                if (this.logger) this.logger("M Input Detected!");
                this.toggleMap();
                event.preventDefault();
                event.stopPropagation();
                return;
            }

            if (key === 'g' || code === 'KeyG') {
                this.isGodMode = !this.isGodMode;
                if (this.logger) this.logger(this.isGodMode ? "God Mode: ON" : "God Mode: OFF");
                this.updateUI();
                event.preventDefault();
                event.stopPropagation();
                return;
            }

            switch (code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.moveForward = true;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.moveLeft = true;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.moveBackward = true;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.moveRight = true;
                    break;
            }
        };
        const onKeyUp = (event) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.moveForward = false;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.moveLeft = false;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.moveBackward = false;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.moveRight = false;
                    break;
            }
        };

        window.addEventListener('keydown', onKeyDown, true);
        window.addEventListener('keyup', onKeyUp, true);
    }

    takeDamage(amount) {
        if (this.isGodMode) return { actualDamage: 0, baseDamage: amount, def: 999, isDead: false };
        const totalDef = this.getTotalDefense();
        const actualDamage = amount > 0 ? Math.max(1, amount - totalDef) : 0;
        this.hp = Math.max(0, this.hp - actualDamage);
        this.updateUI();
        return { actualDamage, baseDamage: amount, def: totalDef, isDead: this.hp <= 0 };
    }

    heal(amount) {
        const previousHP = this.hp;
        this.hp = Math.min(this.maxHp, this.hp + amount);
        const actualHeal = this.hp - previousHP;
        this.updateUI();
        return actualHeal;
    }

    applyStatus(status) {
        // status = { id, name, duration, tickInterval, onTick, onApply, onRemove, ... }
        const existing = this.statuses.find(s => s.id === status.id);
        if (existing) {
            existing.duration = status.duration;
            existing.totalDuration = status.duration;
            existing.tickTimer = status.tickInterval || 0;
        } else {
            const newStatus = {
                ...status,
                totalDuration: status.duration,
                tickTimer: status.tickInterval || 0
            };
            this.statuses.push(newStatus);
            if (newStatus.onApply) newStatus.onApply(this, this.logger);
        }
        this.updateUI();
    }

    useItem(item, index, monsters) {
        if (item.type === 'consumable' || item.itemClass === 'Potion') {
            if (item.healAmount) {
                if (this.hp >= this.maxHp) {
                    return { success: false, message: "Your health is already full!" };
                }
                this.heal(item.healAmount);
                this.inventory.splice(index, 1);
                this._hideTooltip();
                this.updateUI();
                return { success: true, message: `Used ${item.name} and healed for ${item.healAmount} HP` };
            }
            if (item.statusId && STATUSES[item.statusId]) {
                this.applyStatus(STATUSES[item.statusId]);
                this.inventory.splice(index, 1);
                this._hideTooltip();
                this.updateUI();
                return { success: true, message: `Used ${item.name} and gained ${STATUSES[item.statusId].name}` };
            }
            if (item.cleanses) {
                const affected = this.statuses.some(s => s.id === 'plague' || s.id === 'poison');
                if (!affected) {
                    return { success: false, message: "You are not afflicted by any toxins." };
                }
                this.statuses = this.statuses.filter(s => s.id !== 'plague' && s.id !== 'poison');
                this.inventory.splice(index, 1);
                this._hideTooltip();
                this.updateUI();
                return { success: true, message: `Used ${item.name} and cleansed all toxins!` };
            }
        }
        return { success: false };
    }

    getTotalDefense() {
        let bonus = 0;
        for (const slot in this.equipment) {
            const item = this.equipment[slot];
            if (item && item.defense) {
                bonus += item.defense;
            }
        }
        return this.def + bonus;
    }

    addItem(item) {
        if (this.inventory.length < this.maxInventory) {
            this.inventory.push(item);
            this.updateUI();
            this._playPickupSound();
            return true;
        }
        return false;
    }

    equip(item, inventoryIndex) {
        const slot = item.type === 'weapon' ? 'r-hand' : item.type;
        const oldItem = this.equipment[slot];

        // Unequip old item if exists
        if (oldItem) {
            this.inventory[inventoryIndex] = oldItem;
        } else {
            this.inventory.splice(inventoryIndex, 1);
        }

        this.equipment[slot] = item;
        if (item.type === 'weapon') {
            this.weapon = item;
            this.maxAttackCooldown = item.cooldown;
        }

        this._hideTooltip();
        this.updateUI();
    }

    unequip(slot) {
        const item = this.equipment[slot];
        if (item && this.inventory.length < this.maxInventory) {
            this.equipment[slot] = null;
            if (slot === 'r-hand') {
                this.weapon = this.charClass.weapon; // Revert to fists/basic if possible, but here we just use what class has.
                this.maxAttackCooldown = this.weapon.cooldown;
            }
            this.inventory.push(item);
            this._hideTooltip();
            this.updateUI();
        }
    }

    attack(monsters = []) {
        if (this.attackCooldown > 0) return [];
        this.attackCooldown = Math.max(0.1, this.weapon.cooldown); // Minimum 0.1s to prevent frame-perfect double hits
        this.slashTimer = 0.2; // Keep visual animation fast
        this.slashSprite.visible = true;
        this.slashSprite.material.rotation = Math.random() * Math.PI * 2;
        this.slashSprite.material.opacity = 1.0;
        this._playSlashSound();

        // Hit Detection
        let hits = [];
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        const playerPos = this.camera.position;

        for (const monster of monsters) {
            if (!monster.sprite) continue;

            const dist = playerPos.distanceTo(monster.sprite.position);
            if (dist < 1.2) { // Slightly increased range for better feel
                const mDir = monster.sprite.position.clone().sub(playerPos).normalize();
                const dot = forward.dot(mDir);

                if (dot > 0.45) { // Slightly wider cone
                    const baseDamage = this.isGodMode ? 9999 : this.weapon.getDamage();
                    const totalDamage = baseDamage + this.str;
                    const isDead = monster.takeDamage(totalDamage);
                    hits.push({ damage: totalDamage, baseDamage, str: this.str, isDead, monster });
                }
            }
        }
        return hits;
    }

    updateUI() {
        const hpEl = document.getElementById('hp-val');
        const hpMaxEl = document.getElementById('hp-max');
        const strEl = document.getElementById('str-val');
        const defEl = document.getElementById('def-val');
        const goldEl = document.getElementById('gold-val');
        const xpEl = document.getElementById('xp-val');
        const lvlEl = document.getElementById('lvl-val');

        if (hpEl) hpEl.textContent = this.hp;
        if (hpMaxEl) hpMaxEl.textContent = this.maxHp;
        if (strEl) strEl.textContent = this.str;
        if (defEl) defEl.textContent = this.getTotalDefense();
        if (goldEl) goldEl.textContent = this.gold;
        if (xpEl) xpEl.textContent = `${this.xp} / ${this.xpToNextLevel}`;
        if (lvlEl) lvlEl.textContent = this.level;

        // Update Buff Bar
        const buffBar = document.getElementById('buff-bar');
        if (buffBar) {
            // Clear existing except special ones if needed, or just clear all
            buffBar.innerHTML = '';

            // God Mode (Special case)
            if (this.isGodMode) {
                const godEl = document.createElement('div');
                godEl.id = 'buff-god-mode';
                godEl.className = 'buff-icon';
                godEl.title = 'God Mode Active';
                buffBar.appendChild(godEl);
            }

            // Statuses from statusDefinitions
            this.statuses.forEach(status => {
                const statusEl = document.createElement('div');
                statusEl.className = `buff-icon ${status.type || ''}`;
                statusEl.style.backgroundImage = `url('${status.icon}')`;
                const desc = typeof status.description === 'function' ? status.description(this) : status.description;
                statusEl.title = `${status.name}: ${Math.ceil(status.duration)}s remaining. ${desc}`;

                // Add unique styling if needed via ID or class
                if (status.id === 'plague') {
                    statusEl.id = 'buff-plague';
                    statusEl.classList.add('debuff');
                } else if (status.id === 'strength') {
                    statusEl.id = 'buff-strength';
                }

                buffBar.appendChild(statusEl);
            });
        }

        // Update Equipment Slots
        for (const slotName in this.equipment) {
            const item = this.equipment[slotName];
            const slotEl = document.getElementById(`slot-${slotName}`);
            if (slotEl) {
                if (item) {
                    slotEl.style.backgroundImage = `url('${item.icon}')`;
                    slotEl.classList.add('equipped');
                    slotEl.onmouseenter = () => this._showTooltip(item);
                    slotEl.onmouseleave = () => this._hideTooltip();
                    slotEl.title = ""; // Disable native tooltip
                } else {
                    slotEl.style.backgroundImage = 'none';
                    slotEl.classList.remove('equipped');
                    slotEl.onmouseenter = null;
                    slotEl.onmouseleave = null;
                }
            }
        }

        // Update Inventory Grid
        const backpackSlots = document.querySelectorAll('.backpack-slot');
        backpackSlots.forEach((slotEl, index) => {
            const item = this.inventory[index];
            if (item) {
                slotEl.style.backgroundImage = `url('${item.icon}')`;
                slotEl.classList.add('has-item');
                slotEl.onmouseenter = () => this._showTooltip(item);
                slotEl.onmouseleave = () => this._hideTooltip();
                slotEl.title = ""; // Disable native tooltip
            } else {
                slotEl.style.backgroundImage = 'none';
                slotEl.classList.remove('has-item');
                slotEl.onmouseenter = null;
                slotEl.onmouseleave = null;
                slotEl.title = `Backpack Slot ${index + 1}`;
            }
        });
    }

    _showTooltip(item) {
        const tooltip = document.getElementById('tooltip');
        if (!tooltip) return;

        let statsHtml = '';
        if (item.minDamage) {
            statsHtml += `<div class="tooltip-stat"><span class="stat-label">Damage:</span> <span class="stat-val-atk">${item.minDamage}-${item.maxDamage}</span></div>`;
            statsHtml += `<div class="tooltip-stat"><span class="stat-label">Speed:</span> <span>${item.cooldown}s</span></div>`;
        }
        if (item.defense) {
            statsHtml += `<div class="tooltip-stat"><span class="stat-label">Defense:</span> <span class="stat-val-def">+${item.defense}</span></div>`;
        }
        if (item.healAmount) {
            statsHtml += `<div class="tooltip-stat"><span class="stat-label">Heal:</span> <span class="stat-val-heal">${item.healAmount} HP</span></div>`;
        }

        statsHtml += `<div class="tooltip-stat"><span class="stat-label">Value:</span> <span class="stat-val-price">${item.price} G</span></div>`;

        // Better type display: use itemClass if available, else fallback to type or itemType
        const typeText = (item.itemClass || item.type || item.itemType || 'item').toUpperCase();

        tooltip.innerHTML = `
            <div class="tooltip-name">${item.name}</div>
            <div class="tooltip-type">${typeText}</div>
            <div class="tooltip-stats">${statsHtml}</div>
        `;

        // Immediate positioning using global mouse coords
        if (window.mouseX !== undefined) {
            const x = window.mouseX + 15;
            const y = window.mouseY + 15;

            // Boundary checks (simplified, global listener will refine on next move)
            const width = 150; // min-width
            const height = 100; // rough estimate for immediate placement

            let finalX = x;
            let finalY = y;
            if (x + width > window.innerWidth) finalX = window.mouseX - width - 15;
            if (y + height > window.innerHeight) finalY = window.mouseY - height - 15;

            tooltip.style.left = `${finalX}px`;
            tooltip.style.top = `${finalY}px`;
        }

        tooltip.classList.remove('hidden');
    }

    _hideTooltip() {
        const tooltip = document.getElementById('tooltip');
        if (tooltip) tooltip.classList.add('hidden');
    }

    addGold(amount) {
        this.gold += amount;
        this.updateUI();
        this._playPickupSound();
    }

    addXP(amount) {
        this.xp += amount;
        let leveledUp = false;
        while (this.xp >= this.xpToNextLevel) {
            this.levelUp();
            leveledUp = true;
        }
        this.updateUI();
        return leveledUp;
    }

    levelUp() {
        this.level++;
        this.xp -= this.xpToNextLevel;
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.5);

        // Stat boosts
        this.maxHp += 20;
        this.hp = this.maxHp;
        this.str += 2;
        this.def += 1;
        this._playLevelUpSound();
    }

    _playSlashSound() {
        if (!this.soundEnabled) return;
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }

        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const oscillator = this.audioCtx.createOscillator();
        const noiseNode = this.audioCtx.createBufferSource();
        const gainNode = this.audioCtx.createGain();
        const filterNode = this.audioCtx.createBiquadFilter();

        // Create white noise for the 'whoosh'
        const bufferSize = this.audioCtx.sampleRate * 0.2;
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        noiseNode.buffer = buffer;

        // Filter for a sharper slash sound
        filterNode.type = 'bandpass';
        filterNode.frequency.setValueAtTime(1000, this.audioCtx.currentTime);
        filterNode.frequency.exponentialRampToValueAtTime(3000, this.audioCtx.currentTime + 0.1);
        filterNode.Q.setValueAtTime(1, this.audioCtx.currentTime);

        // Gain envelope
        gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, this.audioCtx.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.2);

        noiseNode.connect(filterNode);
        filterNode.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        noiseNode.start();
        noiseNode.stop(this.audioCtx.currentTime + 0.2);

        // Add a subtle metal ring
        const oscillator2 = this.audioCtx.createOscillator();
        const gainNode2 = this.audioCtx.createGain();
        oscillator2.type = 'sine';
        oscillator2.frequency.setValueAtTime(800, this.audioCtx.currentTime);
        oscillator2.frequency.exponentialRampToValueAtTime(400, this.audioCtx.currentTime + 0.1);

        gainNode2.gain.setValueAtTime(0, this.audioCtx.currentTime);
        gainNode2.gain.linearRampToValueAtTime(0.1, this.audioCtx.currentTime + 0.01);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.15);

        oscillator2.connect(gainNode2);
        gainNode2.connect(this.audioCtx.destination);

        oscillator2.start();
        oscillator2.stop(this.audioCtx.currentTime + 0.15);
    }

    _playScratchSound() {
        if (!this.soundEnabled) return;
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }

        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const bufferSize = this.audioCtx.sampleRate * 0.15;
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);

        // Noise with some structure for "scratching"
        for (let i = 0; i < bufferSize; i++) {
            const noise = Math.random() * 2 - 1;
            const sine = Math.sin(i * 0.1); // Low frequency rumble/scratch
            data[i] = (noise * 0.7 + sine * 0.3) * (1 - i / bufferSize);
        }

        const noiseNode = this.audioCtx.createBufferSource();
        noiseNode.buffer = buffer;

        const filterNode = this.audioCtx.createBiquadFilter();
        filterNode.type = 'highpass';
        filterNode.frequency.setValueAtTime(400, this.audioCtx.currentTime);
        filterNode.frequency.exponentialRampToValueAtTime(1200, this.audioCtx.currentTime + 0.1);

        const gainNode = this.audioCtx.createGain();
        gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.4, this.audioCtx.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.15);

        noiseNode.connect(filterNode);
        filterNode.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        noiseNode.start();
        noiseNode.stop(this.audioCtx.currentTime + 0.15);
    }

    _playPickupSound() {
        if (!this.soundEnabled) return;
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }

        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const oscillator = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(440, this.audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(880, this.audioCtx.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, this.audioCtx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.15);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        oscillator.start();
        oscillator.stop(this.audioCtx.currentTime + 0.15);
    }

    _playLevelUpSound() {
        if (!this.soundEnabled) return;
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }

        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const now = this.audioCtx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C Major arpeggio

        notes.forEach((freq, i) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, now + i * 0.1);

            gain.gain.setValueAtTime(0, now + i * 0.1);
            gain.gain.linearRampToValueAtTime(0.1, now + i * 0.1 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.3);
        });
    }

    update(delta, monsters = []) {
        // Discovery & Map UI Logic - Runs even when unlocked (with Line of Sight)
        if (this.dungeon && this.dungeon.map) {
            const map = this.dungeon.map;
            const px = this.camera.position.x;
            const pz = this.camera.position.z;
            const gridX = Math.round(px);
            const gridZ = Math.round(pz);

            const radius = 5;
            for (let oz = -radius; oz <= radius; oz++) {
                for (let ox = -radius; ox <= radius; ox++) {
                    const tx = gridX + ox;
                    const tz = gridZ + oz;

                    if (tx < 0 || tz < 0 || tz >= map.length || tx >= map[tz]?.length) continue;
                    if (this.discoveredTiles.has(`${tx},${tz}`)) continue;

                    // Simple LOS check
                    if (this._hasLOS(gridX, gridZ, tx, tz, map)) {
                        this.discoveredTiles.add(`${tx},${tz}`);
                    }
                }
            }
        }

        this.updateMinimap();
        if (this.isMapOpen) {
            this.renderFullMap();
        }

        if (!this.isLocked) return;

        // --- GAMEPLAY UPDATE (Only when active) ---

        // Update Cooldown
        if (this.attackCooldown > 0) {
            this.attackCooldown -= delta;
            if (this.attackCooldown < 0) this.attackCooldown = 0;
        }

        // Update Slash
        if (this.slashTimer > 0) {
            this.slashTimer -= delta;
            this.slashSprite.material.opacity = Math.max(0, this.slashTimer / 0.2);
            if (this.slashTimer <= 0) {
                this.slashSprite.visible = false;
            }
        }

        // Status Effects
        for (let i = this.statuses.length - 1; i >= 0; i--) {
            const status = this.statuses[i];
            status.duration -= delta;
            status.tickTimer -= delta;

            if (status.tickTimer <= 0 && status.tickInterval) {
                if (status.onTick) status.onTick(this, this.logger);
                status.tickTimer = status.tickInterval;
            }

            if (status.duration <= 0) {
                if (status.onRemove) status.onRemove(this, this.logger);
                this.statuses.splice(i, 1);
                this.updateUI();
            }
        }

        this.velocity.x -= this.velocity.x * 10.0 * delta;
        this.velocity.z -= this.velocity.z * 10.0 * delta;

        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        this.direction.normalize(); // Ensure consistent speed in all directions

        if (this.moveForward || this.moveBackward) this.velocity.z -= this.direction.z * 100.0 * delta; // Accelerated
        if (this.moveLeft || this.moveRight) this.velocity.x -= this.direction.x * 100.0 * delta;

        // Apply movement (copy to a temp vector for collision check)
        const moveX = -this.velocity.x * delta;
        const moveZ = -this.velocity.z * delta; // Three.js Z is backwards? PointerLock moveRight/moveForward handles local space.

        // PointerLockControls moveForward/moveRight api moves the object directly. 
        // We will manually calculate desired position and check collision.

        // We can use controls.moveRight() / moveForward() but they apply immediately.
        // Let's use the velocity to calculate potential offset.

        // Actually, let's keep it simple.
        // We will move using controls.moveRight / moveForward, then check collision, and revert if hit.
        // Or better: Raycasting or Box3 check.
        // Since we are axis aligned mostly, let's try simple checking.

        // For now, let's just stick to standard movement without collision to verify rendering first, 
        // THEN add collision.
        // Wait, collision is in the plan.

        // Let's implement Basic Collision:
        // Predict next position
        const testPos = this.camera.position.clone();

        // We need to know the 'world' direction of movement.
        // clone velocity and apply camera rotation? 
        // PointerLockControls is annoying for physics if we don't have a rigid body.

        // Simplify: Just use 'moveForward' etc logic but manually applying to position.

        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        forward.y = 0;
        forward.normalize();

        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
        right.y = 0;
        right.normalize();

        const moveSpeed = this.speed * delta;
        const velocityVector = new THREE.Vector3();

        if (this.moveForward) velocityVector.add(forward);
        if (this.moveBackward) velocityVector.sub(forward);
        if (this.moveRight) velocityVector.add(right);
        if (this.moveLeft) velocityVector.sub(right);

        if (velocityVector.length() > 0) velocityVector.normalize().multiplyScalar(moveSpeed);

        const nextPos = testPos.clone().add(velocityVector);

        // Collision Check
        const playerBox = new THREE.Box3();
        const playerSize = 0.5;
        playerBox.setFromCenterAndSize(nextPos, new THREE.Vector3(playerSize, 1.8, playerSize));

        let collision = false;
        const walls = this.dungeon.getWalls();
        for (const wallBox of walls) {
            if (playerBox.intersectsBox(wallBox)) {
                collision = true;
                break;
            }
        }

        // Monster Collision
        if (!collision) {
            for (const monster of monsters) {
                const monsterBox = monster.getBoundingBox();
                if (monsterBox && playerBox.intersectsBox(monsterBox)) {
                    collision = true;
                    break;
                }
            }
        }

        if (!collision) {
            this.camera.position.copy(nextPos);
        } else {
            // Sliding collision (simple version: try moving X only, then Z only)
            const nextPosX = testPos.clone().add(new THREE.Vector3(velocityVector.x, 0, 0));
            playerBox.setFromCenterAndSize(nextPosX, new THREE.Vector3(playerSize, 1.8, playerSize));
            let colX = false;
            for (const w of walls) { if (playerBox.intersectsBox(w)) { colX = true; break; } }
            if (!colX) {
                for (const m of monsters) {
                    const mb = m.getBoundingBox();
                    if (mb && playerBox.intersectsBox(mb)) { colX = true; break; }
                }
            }
            if (!colX) {
                this.camera.position.x = nextPosX.x;
            }

            const nextPosZ = testPos.clone().add(new THREE.Vector3(0, 0, velocityVector.z));
            playerBox.setFromCenterAndSize(nextPosZ, new THREE.Vector3(playerSize, 1.8, playerSize));
            let colZ = false;
            for (const w of walls) { if (playerBox.intersectsBox(w)) { colZ = true; break; } }
            if (!colZ) {
                for (const m of monsters) {
                    const mb = m.getBoundingBox();
                    if (mb && playerBox.intersectsBox(mb)) { colZ = true; break; }
                }
            }
            if (!colZ) {
                this.camera.position.z = nextPosZ.z; // Note: if we updated X, we should ideally use updated X for Z check or do them independently? 
                // Independent is safer for corners.
            }
        }

        // Low HP HUD Glow
        const hud = document.getElementById('hud');
        if (hud) {
            const hpPercent = this.hp / this.maxHp;
            if (hpPercent <= 0.25 && this.hp > 0) {
                hud.classList.add('low-hp');
            } else {
                hud.classList.remove('low-hp');
            }
        }
    }

    updateMinimap() {
        const canvas = document.getElementById('minimap-canvas');
        if (!canvas || !this.dungeon) return;
        const ctx = canvas.getContext('2d');
        const map = this.dungeon.map;
        if (!map || !map.length) return;

        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);

        const zoom = 8; // Pixels per tile
        const centerX = width / 2;
        const centerY = height / 2;

        // Draw discovered tiles
        this.discoveredTiles.forEach(key => {
            const parts = key.split(',');
            const tx = parseInt(parts[0]);
            const tz = parseInt(parts[1]);

            // Check if within bounds of the map array
            if (tz >= 0 && tz < map.length && tx >= 0 && tx < map[tz].length) {
                const char = map[tz][tx];

                const dx = centerX + (tx - this.camera.position.x) * zoom;
                const dy = centerY + (tz - this.camera.position.z) * zoom;

                // Only draw if within vicinity (phantom circle)
                const distToCenter = Math.sqrt(Math.pow(dx - centerX, 2) + Math.pow(dy - centerY, 2));
                if (distToCenter < width / 2 - 2) {
                    if (char === '*') {
                        ctx.fillStyle = 'rgba(180, 180, 200, 0.5)'; // Ghostly Wall
                    } else if (char === 'O' || char === '0' || char === 'B') {
                        ctx.fillStyle = 'rgba(255, 215, 0, 0.7)'; // Special points
                    } else {
                        ctx.fillStyle = 'rgba(80, 80, 100, 0.4)'; // Explored Floor
                    }
                    ctx.fillRect(dx - zoom / 2, dy - zoom / 2, zoom, zoom);
                }
            }
        });

        // Draw Player Marker (Glowing phantom)
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ffff';
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    toggleMap() {
        if (this.logger) this.logger(`DEBUG: toggleMap called. Current state: ${this.isMapOpen}`);
        this.isMapOpen = !this.isMapOpen;
        const overlay = document.getElementById('full-map-overlay');
        const instructions = document.getElementById('instructions');

        if (!overlay && this.logger) this.logger("ERROR: full-map-overlay not found!");

        if (overlay) {
            overlay.style.display = this.isMapOpen ? 'flex' : 'none';
            if (this.isMapOpen) {
                if (this.logger) this.logger("Rendering Map Overlay...");
                this.renderFullMap();
                if (this.controls.isLocked) this.controls.unlock();
                // Ensure instructions don't block the map
                if (instructions) instructions.style.display = 'none';
                // Double check after a frame because the lock/unlock event listener in main.js
                // might trigger right after this and show them again.
                setTimeout(() => {
                    if (this.isMapOpen && instructions) instructions.style.display = 'none';
                }, 10);
            } else {
                if (!this.controls.isLocked) this.controls.lock();
            }
        }
    }

    renderFullMap() {
        const canvas = document.getElementById('full-map-canvas');
        if (!canvas || !this.dungeon) return;
        const ctx = canvas.getContext('2d');
        const map = this.dungeon.map;
        if (!map || !map.length) return;

        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);

        // Find map dimensions
        const mapHeight = map.length;
        const mapWidth = Math.max(...map.map(row => row.length));

        // Calculate scale to fit
        const scale = Math.min(width / mapWidth, height / mapHeight);
        const offsetX = (width - mapWidth * scale) / 2;
        const offsetY = (height - mapHeight * scale) / 2;

        // Draw map (Only Discovered)
        map.forEach((row, z) => {
            [...row].forEach((char, x) => {
                if (!this.discoveredTiles.has(`${x},${z}`)) return;

                const dx = offsetX + x * scale;
                const dy = offsetY + z * scale;

                if (char === '*') {
                    ctx.fillStyle = '#444'; // Wall
                } else if (char === 'O' || char === '0' || char === 'B') {
                    ctx.fillStyle = '#f1c40f'; // Special
                } else if (char === 'X') {
                    ctx.fillStyle = '#27ae60'; // Start
                } else {
                    ctx.fillStyle = '#222'; // Floor
                }
                ctx.fillRect(dx, dy, scale - 1, scale - 1);
            });
        });

        // Draw Player Position
        const gridX = this.camera.position.x;
        const gridZ = this.camera.position.z;
        const px = offsetX + gridX * scale;
        const pz = offsetY + gridZ * scale;

        ctx.fillStyle = '#00ffff';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00ffff';
        ctx.beginPath();
        ctx.arc(px, pz, Math.max(2, scale / 3), 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    _hasLOS(x0, z0, x1, z1, map) {
        const dist = Math.sqrt((x1 - x0) ** 2 + (z1 - z0) ** 2);
        if (dist === 0) return true;
        const steps = Math.ceil(dist * 2);
        for (let i = 1; i < steps; i++) {
            const tx = Math.round(x0 + (x1 - x0) * (i / steps));
            const tz = Math.round(z0 + (z1 - z0) * (i / steps));
            if (tx === x1 && tz === z1) return true;
            if (map[tz] && map[tz][tx] === '*') {
                return false; // Path blocked by wall
            }
        }
        return true;
    }
}
