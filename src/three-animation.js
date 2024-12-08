import * as THREE from 'three';

export class CubeAnimation {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ 
            alpha: true,
            antialias: true
        });
        this.cube = null;
        this.time = 0;
        
        this.init();
        this.animate();
    }

    init() {
        // Renderer setup
        const width = Math.min(800, window.innerWidth / 2);
        const height = Math.min(800, window.innerHeight * 0.8);
        this.renderer.setSize(width, height);
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Camera setup
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.camera.position.z = 4;
        this.camera.position.y = 2;
        this.camera.lookAt(0, 0, 0);
        
        // Create cube with enhanced materials
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        
        // Create materials with better visibility
        const materials = [
            // Front face - blue tint
            new THREE.MeshPhysicalMaterial({
                color: 0x2196f3,
                metalness: 0.7,
                roughness: 0.2,
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide,
                envMapIntensity: 1.5,
                clearcoat: 1.0,
                clearcoatRoughness: 0.1
            }),
            // Back face - purple tint
            new THREE.MeshPhysicalMaterial({
                color: 0x9c27b0,
                metalness: 0.7,
                roughness: 0.2,
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide,
                envMapIntensity: 1.5,
                clearcoat: 1.0,
                clearcoatRoughness: 0.1
            }),
            // Top face - cyan tint
            new THREE.MeshPhysicalMaterial({
                color: 0x00bcd4,
                metalness: 0.7,
                roughness: 0.2,
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide,
                envMapIntensity: 1.5,
                clearcoat: 1.0,
                clearcoatRoughness: 0.1
            }),
            // Bottom face - teal tint
            new THREE.MeshPhysicalMaterial({
                color: 0x009688,
                metalness: 0.7,
                roughness: 0.2,
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide,
                envMapIntensity: 1.5,
                clearcoat: 1.0,
                clearcoatRoughness: 0.1
            }),
            // Right face - indigo tint
            new THREE.MeshPhysicalMaterial({
                color: 0x3f51b5,
                metalness: 0.7,
                roughness: 0.2,
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide,
                envMapIntensity: 1.5,
                clearcoat: 1.0,
                clearcoatRoughness: 0.1
            }),
            // Left face - deep purple tint
            new THREE.MeshPhysicalMaterial({
                color: 0x673ab7,
                metalness: 0.7,
                roughness: 0.2,
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide,
                envMapIntensity: 1.5,
                clearcoat: 1.0,
                clearcoatRoughness: 0.1
            })
        ];

        this.cube = new THREE.Mesh(geometry, materials);
        this.cube.castShadow = true;
        this.cube.receiveShadow = true;
        this.scene.add(this.cube);

        // Enhanced lighting setup
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
        mainLight.position.set(5, 5, 5);
        mainLight.castShadow = true;
        this.scene.add(mainLight);

        // Add rim lights for better edge definition
        const rimLight1 = new THREE.PointLight(0x00ffff, 2, 10);
        rimLight1.position.set(2, 2, 2);
        this.scene.add(rimLight1);

        const rimLight2 = new THREE.PointLight(0xff00ff, 2, 10);
        rimLight2.position.set(-2, -2, -2);
        this.scene.add(rimLight2);

        // Create dynamic environment map
        const envMapIntensity = 1;
        const cubeTextureLoader = new THREE.CubeTextureLoader();
        const envMap = cubeTextureLoader.load([
            this.generateGradientDataUrl(0x1a1a1a, 0x000000),
            this.generateGradientDataUrl(0x1a1a1a, 0x000000),
            this.generateGradientDataUrl(0x1a1a1a, 0x000000),
            this.generateGradientDataUrl(0x1a1a1a, 0x000000),
            this.generateGradientDataUrl(0x1a1a1a, 0x000000),
            this.generateGradientDataUrl(0x1a1a1a, 0x000000),
        ]);
        
        this.scene.environment = envMap;
        materials.forEach(material => {
            material.envMap = envMap;
            material.envMapIntensity = envMapIntensity;
        });

        // Handle resize
        window.addEventListener('resize', () => {
            const width = Math.min(800, window.innerWidth / 2);
            const height = Math.min(800, window.innerHeight * 0.8);
            
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
        });
    }

    generateGradientDataUrl(color1, color2) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 256, 256);
        gradient.addColorStop(0, `#${color1.toString(16).padStart(6, '0')}`);
        gradient.addColorStop(1, `#${color2.toString(16).padStart(6, '0')}`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 256, 256);
        return canvas.toDataURL();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.time += 0.01;
        
        // Smooth rotation with varying speeds
        this.cube.rotation.x += 0.004;
        this.cube.rotation.y += 0.006;
        
        // More complex movement
        this.cube.position.y = Math.sin(this.time) * 0.1;
        this.cube.rotation.z = Math.sin(this.time * 0.5) * 0.1;
        
        // Animate rim lights
        const radius = 3;
        const rimLight1 = this.scene.children.find(child => child.type === 'PointLight');
        if (rimLight1) {
            rimLight1.position.x = Math.cos(this.time) * radius;
            rimLight1.position.z = Math.sin(this.time) * radius;
        }
        
        this.renderer.render(this.scene, this.camera);
    }

    getRenderer() {
        return this.renderer.domElement;
    }
} 