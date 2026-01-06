import * as THREE from 'three';

export class Monster {
    constructor(scene, position) {
        this.scene = scene;

        // Load monster texture with chroma key
        const loader = new THREE.TextureLoader();
        loader.load('/monster.png', (texture) => {
            const canvas = document.createElement('canvas');
            const img = texture.image;
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Chroma Key: Remove green background
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                // If green is dominant, make it transparent
                if (g > 100 && g > r && g > b) {
                    data[i + 3] = 0;
                }
            }
            ctx.putImageData(imageData, 0, 0);

            const newTexture = new THREE.CanvasTexture(canvas);
            const spriteMaterial = new THREE.SpriteMaterial({
                map: newTexture,
                transparent: true
            });

            this.sprite = new THREE.Sprite(spriteMaterial);
            this.sprite.scale.set(0.8, 0.8, 1);
            this.sprite.position.copy(position);
            this.sprite.position.y = 0.4; // Half height since scale is 0.8

            this.scene.add(this.sprite);
        });
    }

    update() {
    }

    remove() {
        if (this.sprite) this.scene.remove(this.sprite);
    }
}
