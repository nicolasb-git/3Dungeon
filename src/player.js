import * as THREE from 'three';

import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export class Player {
    constructor(camera, domElement, dungeon) {
        this.camera = camera;
        this.dungeon = dungeon;
        this.controls = new PointerLockControls(camera, domElement);

        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.isLocked = false;
        this.speed = 5.0; // Movement speed
        this.weapon = 'Basic Sword';
        this.hp = 100;
        this.maxHp = 100;
        this.str = 10;
        this.def = 0;
        this.gold = 0;
        this.xp = 0;

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
        this.maxAttackCooldown = 0.5;
        this.audioCtx = null;

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
            switch (event.code) {
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

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
    }

    takeDamage(amount) {
        const actualDamage = Math.max(0, amount - this.def);
        this.hp = Math.max(0, this.hp - actualDamage);
        this.updateUI();
        return { actualDamage, baseDamage: amount, def: this.def, isDead: this.hp <= 0 };
    }

    attack(monsters = []) {
        if (this.attackCooldown > 0) return null;
        this.attackCooldown = this.maxAttackCooldown;
        this.slashTimer = 0.2; // Keep visual animation fast
        this.slashSprite.visible = true;
        this.slashSprite.material.rotation = Math.random() * Math.PI * 2;
        this.slashSprite.material.opacity = 1.0;
        this._playSlashSound();

        // Hit Detection
        let hitInfo = null;
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        const playerPos = this.camera.position;

        for (const monster of monsters) {
            if (!monster.sprite) continue;

            // Check distance
            const dist = playerPos.distanceTo(monster.sprite.position);
            if (dist < 1.0) {
                // Check if monster is in front of player
                const mDir = monster.sprite.position.clone().sub(playerPos).normalize();
                const dot = forward.dot(mDir);

                if (dot > 0.5) { // Roughly 60 degrees cone
                    const baseDamage = Math.floor(Math.random() * 3) + 2; // Base (2, 3, or 4)
                    const totalDamage = baseDamage + this.str;
                    const isDead = monster.takeDamage(totalDamage);
                    hitInfo = { damage: totalDamage, baseDamage, str: this.str, isDead, monster };
                    break; // Hit one monster per slash
                }
            }
        }
        return hitInfo;
    }

    updateUI() {
        const hpEl = document.getElementById('hp-val');
        const strEl = document.getElementById('str-val');
        const defEl = document.getElementById('def-val');
        const goldEl = document.getElementById('gold-val');
        const xpEl = document.getElementById('xp-val');

        if (hpEl) hpEl.textContent = this.hp;
        if (strEl) strEl.textContent = this.str;
        if (defEl) defEl.textContent = this.def;
        if (goldEl) goldEl.textContent = this.gold;
        if (xpEl) xpEl.textContent = this.xp;
    }

    addGold(amount) {
        this.gold += amount;
        this.updateUI();
    }

    addXP(amount) {
        this.xp += amount;
        this.updateUI();
    }

    _playSlashSound() {
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

    update(delta, monsters = []) {
        // Update Cooldown
        if (this.attackCooldown > 0) {
            this.attackCooldown -= delta;
        }

        // Update Slash
        if (this.slashTimer > 0) {
            this.slashTimer -= delta;
            this.slashSprite.material.opacity = Math.max(0, this.slashTimer / 0.2);
            if (this.slashTimer <= 0) {
                this.slashSprite.visible = false;
            }
        }

        if (!this.isLocked) return;

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
    }
}
