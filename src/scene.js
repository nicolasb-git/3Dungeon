import * as THREE from 'three';

export function setupScene() {
    const scene = new THREE.Scene();
    const fogColor = 0x101010;
    scene.fog = new THREE.Fog(fogColor, 0, 15);
    scene.background = new THREE.Color(fogColor);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / (window.innerHeight * 0.8), 0.1, 1000);

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

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / (window.innerHeight * 0.8);
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight * 0.8);
    });

    return { scene, camera, renderer };
}
