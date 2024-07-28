// Three.js setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById('neural-constellation').appendChild(renderer.domElement);

// Create a more complex cosmic core
const coreGeometry = new THREE.IcosahedronGeometry(5, 2);
const coreMaterial = new THREE.MeshPhongMaterial({
    color: 0x00ffff,
    emissive: 0x00ffff,
    specular: 0xffffff,
    shininess: 100,
    wireframe: true,
    transparent: true,
    opacity: 0.8
});
const cosmicCore = new THREE.Mesh(coreGeometry, coreMaterial);
scene.add(cosmicCore);

// Add ambient light
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

// Add point light
const pointLight = new THREE.PointLight(0x00ffff, 1, 100);
pointLight.position.set(0, 0, 10);
scene.add(pointLight);

camera.position.z = 15;

// Enhanced Particle system
const particlesGeometry = new THREE.BufferGeometry();
const particleCount = 10000;
const posArray = new Float32Array(particleCount * 3);
const colorArray = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount * 3; i += 3) {
    posArray[i] = (Math.random() - 0.5) * 100;
    posArray[i + 1] = (Math.random() - 0.5) * 100;
    posArray[i + 2] = (Math.random() - 0.5) * 100;

    const color = new THREE.Color(getRandomColor());
    colorArray[i] = color.r;
    colorArray[i + 1] = color.g;
    colorArray[i + 2] = color.b;
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

const particlesMaterial = new THREE.PointsMaterial({
    size: 0.01,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
});

const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

const thoughtInput = document.getElementById('thought-input');
const aiResponse = document.getElementById('ai-response');
const statusIndicator = document.getElementById('status-indicator');

function createSynapse(endX, endY) {
    const synapse = document.createElement('div');
    synapse.className = 'synapse';
    
    const startX = window.innerWidth / 2;
    const startY = window.innerHeight / 2;
    
    const length = Math.hypot(endX - startX, endY - startY);
    const angle = Math.atan2(endY - startY, endX - startX);
    
    synapse.style.position = 'absolute';
    synapse.style.width = '2px';
    synapse.style.height = `${length}px`;
    synapse.style.left = `${startX}px`;
    synapse.style.top = `${startY}px`;
    synapse.style.transformOrigin = 'top';
    synapse.style.transform = `rotate(${angle}rad)`;
    
    document.getElementById('synaptic-web').appendChild(synapse);

    // Choose a random animation style
    const animationStyle = Math.floor(Math.random() * 4);

    switch(animationStyle) {
        case 0: // Pulsating line
            gsap.fromTo(synapse, 
                { background: `linear-gradient(to top, ${getRandomColor()}, transparent)`, height: 0 },
                {
                    height: length, duration: 1, ease: "power1.inOut", 
                    repeat: -1, yoyo: true, repeatDelay: 0.5 
                }
            );
            break;
        case 1: // Particle flow
            synapse.style.overflow = 'hidden';
            for (let i = 0; i < 5; i++) {
                const particle = document.createElement('div');
                particle.style.position = 'absolute';
                particle.style.width = '4px';
                particle.style.height = '4px';
                particle.style.borderRadius = '50%';
                particle.style.backgroundColor = getRandomColor();
                synapse.appendChild(particle);

                gsap.fromTo(particle,
                    { top: length, opacity: 1 },
                    {
                        top: 0, opacity: 0, duration: 1 + Math.random(), 
                        repeat: -1, ease: "power1.in", delay: i * 0.2 
                    }
                );
            }
            break;
        case 2: // Electric zap
            const zap = document.createElement('div');
            zap.style.position = 'absolute';
            zap.style.width = '100%';
            zap.style.height = '100%';
            zap.style.backgroundImage = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><path d="M0 50 Q 25 0, 50 50 T 100 50" fill="none" stroke="${getRandomColor()}" stroke-width="2"/></svg>')`;
            zap.style.backgroundRepeat = 'repeat-y';
            zap.style.backgroundSize = '100% 20px';
            synapse.appendChild(zap);

            gsap.to(zap, { backgroundPosition: '0 20px', duration: 0.5, repeat: -1, ease: "steps(1)" });
            break;
        case 3: // Glowing orb
            const orb = document.createElement('div');
            orb.style.position = 'absolute';
            orb.style.width = '10px';
            orb.style.height = '10px';
            orb.style.borderRadius = '50%';
            orb.style.backgroundColor = getRandomColor();
            orb.style.boxShadow = '0 0 10px 5px ' + getRandomColor();
            synapse.appendChild(orb);

            gsap.fromTo(orb,
                { top: length, scale: 0 },
                {
                    top: 0, scale: 1, duration: 1.5, 
                    repeat: -1, ease: "power1.inOut" 
                }
            );
            break;
    }

    // Fade out and remove synapse after a while
    gsap.to(synapse, {
        opacity: 0,
        delay: 5 + Math.random() * 5,
        duration: 1,
        onComplete: () => synapse.remove()
    });
}

// Helper function to get a random color
function getRandomColor() {
    return `hsl(${Math.random() * 360}, 100%, 50%)`;
}

// Function to create multiple synapses
function createMultipleSynapses(count) {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 200 + 100; // Adjust based on your design
        const startX = centerX + Math.cos(angle) * distance;
        const startY = centerY + Math.sin(angle) * distance;
        createSynapse(startX, startY);
    }
}

setInterval(() => createMultipleSynapses(5), 3000); // Create 5 synapses every 3 seconds

thoughtInput.addEventListener('input', () => {
    createMultipleSynapses(1); // Create a single synapse for each keystroke
    pulseCosmicCore(0.3);
    pulsateEnergyField(0.5);
});

// Use this function to create synapses when the AI responds
function onAIResponse() {
    createMultipleSynapses(1); // Adjust the number as needed
}
        
const responseSound = document.getElementById('response-sound');
let messageHistory = [];

async function getAIResponse(input) {
    aiResponse.style.opacity = 0;
    aiResponse.style.transform = 'translateX(-50%) scale(0.9)';
    statusIndicator.textContent = "The Cosmic is processing...";
    statusIndicator.style.opacity = 1;

    pulseCosmicCore(1);
    pulsateEnergyField(1);

    messageHistory.push({
        role: "user",
        content: input
    });

    try {
        const response = await fetch('/.netlify/functions/zenithProxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ messages: messageHistory })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error fetching completion:', errorData);
            throw new Error(`API request failed with status: ${response.status}. Details: ${JSON.stringify(errorData)}`);
        }

        const responseData = await response.json(); 
        const fullResponse = responseData.content;

        aiResponse.textContent = fullResponse;

        messageHistory.push({
            role: "assistant",
            content: fullResponse
        });

    } catch (error) {
        console.error('Error:', error);
        aiResponse.textContent = "The cosmic streams are momentarily disturbed. Please recalibrate your thoughts and try again.";
    } finally {
        gsap.to(aiResponse, {
            opacity: 1,
            transform: 'translateX(-50%) scale(1)',
            duration: 0.5
        });
        statusIndicator.style.opacity = 0;
        responseSound.play();
    }
}

thoughtInput.addEventListener('keypress', async function(e) {
    if (e.key === 'Enter') {
        const thought = this.value.trim();
        if (thought) {
            this.value = '';
            await getAIResponse(thought);
        }
    }
});

// Dynamic color shift
function shiftColors() {
    const hue = (Date.now() / 100) % 360;
    document.documentElement.style.setProperty('--primary-color', `hsl(${hue}, 100%, 50%)`);
    document.documentElement.style.setProperty('--secondary-color', `hsl(${(hue + 120) % 360}, 100%, 50%)`);
    requestAnimationFrame(shiftColors);
}
shiftColors();

// Cosmic nebula background
const nebula = new THREE.TextureLoader().load('../images/nebula_texture.jpg');
const nebulaGeometry = new THREE.PlaneGeometry(200, 200);
const nebulaMaterial = new THREE.MeshBasicMaterial({
    map: nebula,
    transparent: true,
    opacity: 0.2
});
const nebulaMesh = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
nebulaMesh.position.z = -50;
scene.add(nebulaMesh);

function animate() {
    cosmicCore.rotation.x += 0.005;
    cosmicCore.rotation.y += 0.005;
    particlesMesh.rotation.y += 0.0005;
    nebulaMesh.rotation.z += 0.0001;
    
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
animate();

// Use requestAnimationFrame to keep the animation running even when not focused
requestAnimationFrame(animate);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Welcome screen animation
const welcomeScreen = document.getElementById('welcome-screen');
const welcomeText = document.getElementById('welcome-text');
const constellationText = document.getElementById('constellation-text');
const neuralConstellation = document.getElementById('neural-constellation');

gsap.registerPlugin(TextPlugin);

gsap.to(welcomeText, {
    opacity: 1,
    duration: 2,
    delay: 1,
    onComplete: () => {
        gsap.to(constellationText, {
            opacity: 1,
            duration: 1,
            onComplete: () => {
                // Animate the "Constellation Zenith" text
                gsap.to(constellationText, {
                    duration: 2,
                    text: {
                        value: "Constellation Zenith",
                        delimiter: ""
                    },
                    ease: "power1.inOut",
                    repeat: -1,
                    yoyo: true,
                    repeatDelay: 1
                });

                // Fade out welcome screen and show main content
                gsap.to(welcomeScreen, {
                    opacity: 0,
                    duration: 1,
                    delay: 3,
                    onComplete: () => {
                        welcomeScreen.style.display = 'none';
                        gsap.to(neuralConstellation, {
                            opacity: 1,
                            duration: 1,
                            onComplete: () => {
                                // Play ambient sound after welcome screen disappears
                                ambientSound.play();
                            }
                        });
                    }
                });
            }
        });
    }
});

// Interactive particle effect
document.addEventListener('mousemove', (event) => {
    const mouseX = event.clientX / window.innerWidth - 0.5;
    const mouseY = event.clientY / window.innerHeight - 0.5;
    gsap.to(particlesMesh.rotation, {
        x: mouseY * 0.5,
        y: mouseX * 0.5,
        duration: 2
    });
});

// Pulsating Energy Field
const energyField = document.getElementById('energy-field');

function pulsateEnergyField(intensity = 1) {
    gsap.to(energyField, {
        scale: 1 + (0.2 * intensity),
        opacity: 0.7 * intensity,
        duration: 0.5,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut"
    });
}

// Responsive Cosmic Core
function pulseCosmicCore(intensity = 1) {
    gsap.to(cosmicCore.scale, {
        x: 1 + (0.2 * intensity),
        y: 1 + (0.2 * intensity),
        z: 1 + (0.2 * intensity),
        duration: 0.3,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut"
    });

    gsap.to(cosmicCore.material, {
        emissiveIntensity: 1 + intensity,
        duration: 0.3,
        yoyo: true,
        repeat: 1
    });
}

// Add mouse interaction for cosmic core
renderer.domElement.addEventListener('mousemove', (event) => {
    const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    
    gsap.to(cosmicCore.rotation, {
        x: mouseY * 0.1,
        y: mouseX * 0.1,
        duration: 1
    });
});

// Update Log
document.addEventListener('DOMContentLoaded', () => {
    const updateLogContainer = document.getElementById('update-log-container');
    const toggleButton = document.getElementById('toggle-update-log');
    const updateLogContent = document.getElementById('update-log-content');

    toggleButton.addEventListener('click', () => {
    updateLogContainer.classList.toggle('hidden');
    if (!updateLogContainer.classList.contains('hidden')) {
        gsap.to(updateLogContent, {
        opacity: 1,
        y: 0,
        duration: 0.3,
        ease: 'power2.out'
        });
    } else {
        gsap.to(updateLogContent, {
        opacity: 0,
        y: -10,
        duration: 0.3,
        ease: 'power2.in'
        });
    }
    });
});

// Add ambient space sounds
const ambientSound = new Audio('../neural-constellation-zenith/space.mp3');
ambientSound.loop = true;
ambientSound.volume = 0.1;

// Audio control
const audioControl = document.getElementById('audio-control');
let isMuted = false; // Changed to false so it starts unmuted

audioControl.addEventListener('click', () => {
    if (isMuted) {
        ambientSound.play();
        audioControl.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>';
    } else {
        ambientSound.pause();
        audioControl.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>';
    }
    isMuted = !isMuted;
});

// Enhanced thought bubble animation
function createThoughtBubble() {
    const bubble = document.createElement('div');
    bubble.className = 'thought-bubble';
    bubble.style.position = 'absolute';
    bubble.style.width = '10px';
    bubble.style.height = '10px';
    bubble.style.borderRadius = '50%';
    bubble.style.backgroundColor = 'var(--primary-color)';
    bubble.style.boxShadow = '0 0 10px var(--primary-color)';
    document.getElementById('neural-constellation').appendChild(bubble);

    gsap.fromTo(bubble, 
        { x: thoughtInput.offsetLeft, y: thoughtInput.offsetTop, scale: 1 },
        { 
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            scale: 0,
            duration: 1.5,
            ease: "power2.inOut",
            onComplete: () => bubble.remove()
        }
    );
}

thoughtInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        createThoughtBubble();
    }
});

// Particle pulsing effect
function pulseParticles() {
    gsap.to(particlesMesh.material, {
        size: 0.02,
        duration: 0.5,
        yoyo: true,
        repeat: 1
    });
}

// Cosmic energy waves
function createCosmicWave() {
    const wave = document.createElement('div');
    wave.className = 'cosmic-wave';
    wave.style.position = 'absolute';
    wave.style.width = '10px';
    wave.style.height = '10px';
    wave.style.borderRadius = '50%';
    wave.style.border = '2px solid var(--primary-color)';
    wave.style.left = '50%';
    wave.style.top = '50%';
    wave.style.transform = 'translate(-50%, -50%)';
    document.getElementById('neural-constellation').appendChild(wave);

    gsap.to(wave, {
        width: '300px',
        height: '300px',
        opacity: 0,
        duration: 2,
        ease: "power2.out",
        onComplete: () => wave.remove()
    });
}

setInterval(createCosmicWave, 3000);