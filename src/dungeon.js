import * as THREE from 'three';

export class Dungeon {
    constructor(mapString) {
        this.map = mapString.trim().split('\n');
        this.group = new THREE.Group();
        this.startPosition = new THREE.Vector3(0, 0, 0);
        this.walls = []; // Store wall bounding boxes for collision
        this.emptySpaces = []; // Store empty floor coords
        this.bossSpawnPoint = null;
        this.bossExitMesh = null;
        this.bossExitTrigger = null;
        this.generate();
    }

    generate() {
        const loader = new THREE.TextureLoader();

        // Load textures
        const floorTexture = loader.load('/cobblestone.png');
        floorTexture.wrapS = THREE.RepeatWrapping;
        floorTexture.wrapT = THREE.RepeatWrapping;
        floorTexture.repeat.set(1, 1);

        const wallTexture = loader.load('/stone_bricks.png');
        wallTexture.wrapS = THREE.RepeatWrapping;
        wallTexture.wrapT = THREE.RepeatWrapping;
        wallTexture.repeat.set(1, 2); // 2 units high

        // Materials
        const wallMaterial = new THREE.MeshStandardMaterial({ map: wallTexture });
        const floorMaterial = new THREE.MeshStandardMaterial({ map: floorTexture });
        const ceilingMaterial = new THREE.MeshStandardMaterial({ color: 0x202020 }); // Dark ceiling
        const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // SaddleBrown for door

        const geometry = new THREE.BoxGeometry(1, 2, 1); // Wall is 2 units high
        const planeGeo = new THREE.PlaneGeometry(1, 1);
        const doorGeo = new THREE.BoxGeometry(1, 2, 0.2); // Thin door

        this.map.forEach((row, z) => {
            [...row].forEach((char, x) => {
                // Ground for everyone
                const floor = new THREE.Mesh(planeGeo, floorMaterial);
                floor.rotation.x = -Math.PI / 2;
                floor.position.set(x, 0, z);
                this.group.add(floor);

                // Ceiling
                const ceiling = new THREE.Mesh(planeGeo, ceilingMaterial);
                ceiling.rotation.x = Math.PI / 2;
                ceiling.position.set(x, 2, z);
                this.group.add(ceiling);

                if (char === '*') {
                    // Wall
                    const wall = new THREE.Mesh(geometry, wallMaterial);
                    wall.position.set(x, 1, z); // Center at height 1 (since height is 2)
                    this.group.add(wall);

                    // Add collision box
                    const box = new THREE.Box3().setFromObject(wall);
                    this.walls.push(box);
                } else if (char === 'X') {
                    // Start Position
                    this.startPosition.set(x, 0.5, z); // Player eye level approx
                } else if (char === 'O') {
                    // Door / Exit
                    const door = new THREE.Mesh(doorGeo, doorMaterial);
                    door.position.set(x, 1, z);
                    this.group.add(door); // Decorative 3D object

                    // Add trigger box (slightly larger than the tile)
                    const box = new THREE.Box3();
                    box.setFromCenterAndSize(new THREE.Vector3(x, 1, z), new THREE.Vector3(0.8, 2, 0.8));
                    this.exit = box;
                } else if (char === 'B') {
                    // Boss Spawn Position
                    this.bossSpawnPoint = new THREE.Vector3(x, 0.5, z);
                } else if (char === '0') {
                    // Boss Exit (hidden by default)
                    const door = new THREE.Mesh(doorGeo, doorMaterial);
                    door.position.set(x, 1, z);
                    door.visible = false;
                    this.group.add(door);
                    this.bossExitMesh = door;

                    // Add trigger box
                    const box = new THREE.Box3();
                    box.setFromCenterAndSize(new THREE.Vector3(x, 1, z), new THREE.Vector3(0.8, 2, 0.8));
                    this.bossExitTrigger = box;
                } else if (char === ' ') {
                    // Empty floor
                    this.emptySpaces.push({ x, z });
                }
            });
        });
    }

    getMesh() {
        return this.group;
    }

    getStartPosition() {
        return this.startPosition;
    }

    getWalls() {
        return this.walls;
    }

    getExit() {
        return this.exit;
    }

    getEmptySpaces() {
        return this.emptySpaces;
    }

    getBossSpawnPoint() {
        return this.bossSpawnPoint;
    }

    getBossExitMesh() {
        return this.bossExitMesh;
    }

    getBossExitTrigger() {
        return this.bossExitTrigger;
    }
}
