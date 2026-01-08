import * as THREE from 'three';

export class Monster {
    constructor(scene, position) {
        this.scene = scene;
        this.initialPosition = position.clone();
        this.name = "Lesser Shadow";
        this.hp = 10;
        this.attackDamage = { min: 2, max: 3 };
        this.attackCooldown = 0;
        this.maxAttackCooldown = 3.0;
        this.speed = 1.0; // Movement speed
        this.spottedPlayer = false;

        this.textures = { idle: null, attack: null };
        this.currentState = 'idle';
        this.animationTimer = 0;

        this._loadTextures();
    }

    _loadTextures() {
        const loader = new THREE.TextureLoader();

        // Load Idle
        this._processTexture(loader, '/monster.png', 'idle');
        // Load Attack
        this._processTexture(loader, '/monster_attack.png', 'attack');
    }

    _processTexture(loader, path, key) {
        loader.load(path, (texture) => {
            const canvas = document.createElement('canvas');
            const img = texture.image;
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Simple but aggressive chroma key
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                // If green is the prominent color, make it transparent
                if (g > 70 && g > r && g > b) {
                    data[i + 3] = 0;
                }
            }
            ctx.putImageData(imageData, 0, 0);

            const newTexture = new THREE.CanvasTexture(canvas);
            newTexture.colorSpace = THREE.SRGBColorSpace;
            this.textures[key] = newTexture;

            if (!this.sprite) {
                const spriteMaterial = new THREE.SpriteMaterial({
                    map: newTexture,
                    transparent: true
                });
                this.sprite = new THREE.Sprite(spriteMaterial);
                this.sprite.scale.set(0.8, 0.8, 1);
                this.sprite.position.copy(this.initialPosition);
                this.sprite.position.y = 0.4;
                this.scene.add(this.sprite);

                this.box = new THREE.Box3();
                this.updateBox();
            } else if (this.currentState === key) {
                this.sprite.material.map = newTexture;
                this.sprite.material.needsUpdate = true;
            }
        });
    }

    updateBox() {
        if (this.sprite) {
            this.box.setFromCenterAndSize(this.sprite.position, new THREE.Vector3(0.4, 0.8, 0.4));
        }
    }

    getBoundingBox() {
        return this.box;
    }

    takeDamage(amount) {
        this.hp -= amount;
        return this.hp <= 0;
    }

    getAttackDamage() {
        return Math.floor(Math.random() * (this.attackDamage.max - this.attackDamage.min + 1)) + this.attackDamage.min;
    }

    playAttackAnimation() {
        if (!this.sprite || !this.textures.attack) return;
        this.currentState = 'attack';
        this.sprite.material.map = this.textures.attack;
        this.sprite.material.needsUpdate = true;
        this.sprite.scale.set(1.0, 1.0, 1); // Jump scale for impact
        this.animationTimer = 0.5;
    }

    update(delta) {
        if (this.attackCooldown > 0) {
            this.attackCooldown -= delta;
        }

        if (this.animationTimer > 0) {
            this.animationTimer -= delta;
            if (this.animationTimer <= 0) {
                this.currentState = 'idle';
                if (this.sprite && this.textures.idle) {
                    this.sprite.material.map = this.textures.idle;
                    this.sprite.material.needsUpdate = true;
                    this.sprite.scale.set(0.8, 0.8, 1); // Reset scale
                }
            }
        }

        this.updateBox();
    }

    hasLineOfSight(playerPos, walls) {
        if (!this.sprite) return false;

        const start = this.sprite.position.clone();
        start.y = 0.5; // Ray height at eye level
        const end = playerPos.clone();
        end.y = 0.5;

        const direction = end.clone().sub(start).normalize();
        const distanceToPlayer = start.distanceTo(end);

        const ray = new THREE.Ray(start, direction);
        const intersection = new THREE.Vector3();

        for (const wallBox of walls) {
            if (ray.intersectBox(wallBox, intersection)) {
                if (start.distanceTo(intersection) < distanceToPlayer) {
                    return false; // Wall is blocking
                }
            }
        }
        return true;
    }

    moveTowards(targetPos, delta, walls) {
        if (!this.sprite || this.currentState === 'attack') return;

        const dir = targetPos.clone().sub(this.sprite.position);
        dir.y = 0;

        if (dir.length() < 0.6) return; // Keep a small distance to avoid overlapping player

        dir.normalize();
        const movement = dir.multiplyScalar(this.speed * delta);
        const nextPos = this.sprite.position.clone().add(movement);

        // Movement Collision check
        const testBox = new THREE.Box3().setFromCenterAndSize(
            nextPos,
            new THREE.Vector3(0.4, 0.8, 0.4)
        );

        let collision = false;
        for (const wall of walls) {
            if (testBox.intersectsBox(wall)) {
                collision = true;
                break;
            }
        }

        if (!collision) {
            this.sprite.position.copy(nextPos);
        } else {
            // Try sliding (X then Z)
            const nextPosX = this.sprite.position.clone().add(new THREE.Vector3(movement.x, 0, 0));
            testBox.setFromCenterAndSize(nextPosX, new THREE.Vector3(0.4, 0.8, 0.4));
            let colX = false;
            for (const w of walls) { if (testBox.intersectsBox(w)) { colX = true; break; } }
            if (!colX) this.sprite.position.x = nextPosX.x;

            const nextPosZ = this.sprite.position.clone().add(new THREE.Vector3(0, 0, movement.z));
            testBox.setFromCenterAndSize(nextPosZ, new THREE.Vector3(0.4, 0.8, 0.4));
            let colZ = false;
            for (const w of walls) { if (testBox.intersectsBox(w)) { colZ = true; break; } }
            if (!colZ) this.sprite.position.z = nextPosZ.z;
        }

        this.updateBox();
    }

    remove() {
        if (this.sprite) this.scene.remove(this.sprite);
    }
}
