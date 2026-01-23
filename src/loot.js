import * as THREE from 'three';

export class Loot {
    constructor(scene, position, amount = 0, item = null) {
        this.scene = scene;
        this.position = position.clone();
        this.amount = amount;
        this.item = item;
        this.collected = false;
        this.removed = false;

        const texturePath = this.item ? this.item.icon : '/items/gold_coins.png';

        const loader = new THREE.TextureLoader();
        loader.load(texturePath, (texture) => {
            const canvas = document.createElement('canvas');
            const img = texture.image;
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Chroma key green
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                // Slightly different thresholds for items vs gold if needed, 
                // but let's stick to simple green chroma key.
                if (g > 150 && g > r && g > b) {
                    data[i + 3] = 0;
                }
            }
            ctx.putImageData(imageData, 0, 0);

            const newTexture = new THREE.CanvasTexture(canvas);
            newTexture.colorSpace = THREE.SRGBColorSpace;

            if (this.removed) return;

            const material = new THREE.SpriteMaterial({ map: newTexture, transparent: true });
            this.sprite = new THREE.Sprite(material);
            this.sprite.scale.set(0.4, 0.4, 1);
            this.sprite.position.copy(this.position);
            this.sprite.position.y = 0.2;
            this.scene.add(this.sprite);
            this.updateBox();
        });

        this.box = new THREE.Box3();
        this.updateBox();
    }

    updateBox() {
        const pos = this.sprite ? this.sprite.position : this.position;
        this.box.setFromCenterAndSize(pos, new THREE.Vector3(0.5, 0.5, 0.5));
    }

    getBoundingBox() {
        return this.box;
    }

    remove() {
        this.removed = true;
        if (this.sprite) {
            this.scene.remove(this.sprite);
        }
    }
}
