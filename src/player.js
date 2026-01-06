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

        this._initListeners(domElement);
    }

    _initListeners(domElement) {
        domElement.addEventListener('click', () => {
            if (!this.isLocked) {
                this.controls.lock();
            }
        });

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

    update(delta) {
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

        if (!collision) {
            this.camera.position.copy(nextPos);
        } else {
            // Sliding collision (simple version: try moving X only, then Z only)
            const nextPosX = testPos.clone().add(new THREE.Vector3(velocityVector.x, 0, 0));
            playerBox.setFromCenterAndSize(nextPosX, new THREE.Vector3(playerSize, 1.8, playerSize));
            let colX = false;
            for (const w of walls) { if (playerBox.intersectsBox(w)) { colX = true; break; } }
            if (!colX) {
                this.camera.position.x = nextPosX.x;
            }

            const nextPosZ = testPos.clone().add(new THREE.Vector3(0, 0, velocityVector.z));
            playerBox.setFromCenterAndSize(nextPosZ, new THREE.Vector3(playerSize, 1.8, playerSize));
            let colZ = false;
            for (const w of walls) { if (playerBox.intersectsBox(w)) { colZ = true; break; } }
            if (!colZ) {
                this.camera.position.z = nextPosZ.z; // Note: if we updated X, we should ideally use updated X for Z check or do them independently? 
                // Independent is safer for corners.
            }
        }
    }
}
