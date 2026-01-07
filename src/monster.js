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

    remove() {
        if (this.sprite) this.scene.remove(this.sprite);
    }
}
