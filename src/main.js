// Animated background
const bg = document.querySelector('.animated-bg');
const objectCounts = {
    star: 200,
    planet: 8,  // Changed to 8 for the planets in our solar system
    asteroid: 10,
    galaxy: 2,
    shikanoko: 1
};

const planetNames = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];

function createSpaceObject(className, count, speedMultiplier = 1) {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
        let obj;
        if (className === 'planet') {
            obj = createPlanetElement(planetNames[i]);
        } else {
            obj = createSpaceObjectElement(className);
        }
        setSpaceObjectStyle(obj, className);
        fragment.appendChild(obj);
        animateObject(obj, speedMultiplier, className);
    }
    bg.appendChild(fragment);
}

function createPlanetElement(planetName) {
    const obj = document.createElement('div');
    obj.className = 'planet';
    obj.style.backgroundImage = `url('images/${planetName}.png')`;
    obj.style.backgroundSize = 'cover';
    return obj;
}

function animateObject(obj, speedMultiplier, className) {
    const speed = (0.05 + Math.random() * 0.05) * speedMultiplier;
    let currentTop = parseFloat(obj.style.top);
    
    function move() {
        currentTop = updatePosition(currentTop, speed);
        obj.style.top = `${currentTop}%`;
        if (currentTop <= -5) {
            resetObjectPosition(obj, className);
        }
        requestAnimationFrame(move);
    }
    move();
}

function createSpaceObjectElement(className) {
    const obj = document.createElement('div');
    obj.className = className;
    return obj;
}

function setSpaceObjectStyle(obj, className) {
    const styleCreators = {
        star: () => ({}),
        planet: createPlanetStyle,
        galaxy: createGalaxyStyle,
        shikanoko: () => ({ display: 'none' }),
        asteroid: () => ({})
    };

    const style = styleCreators[className](obj);
    Object.assign(obj.style, {
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        ...style
    });
}

function createPlanetStyle(obj) {
    const planetSizes = {
        mercury: 10,
        venus: 15,
        earth: 16,
        mars: 14,
        jupiter: 35,
        saturn: 30,
        uranus: 25,
        neptune: 24
    };

    const planetName = obj.style.backgroundImage.match(/images\/(\w+)\.png/)[1];
    const size = planetSizes[planetName];

    return {
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%'
    };
}

function createGalaxyStyle() {
    const size = 100 + Math.random() * 100;
    return {
        width: `${size}px`,
        height: `${size / 2}px`,
        transform: `rotate(${Math.random() * 360}deg)`
    };
}

function updatePosition(currentTop, speed) {
    currentTop += speed;
    if (currentTop > 100) {
        currentTop = -5;
    }
    return currentTop;
}

function resetObjectPosition(obj, className) {
    obj.style.left = `${Math.random() * 100}%`;
    if (className === 'shikanoko') {
        obj.style.display = Math.random() < 0.2 ? 'block' : 'none';
    }
}

function splitTextIntoSpans(elementId) {
    const element = document.getElementById(elementId);
    const text = element.textContent;
    element.textContent = '';
    
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '|') {
            // Add a space element
            element.appendChild(document.createTextNode(' '));
            continue;
        }
        
        const span = document.createElement('span');
        span.textContent = text[i];
        span.setAttribute('data-text', text[i]);
        
        element.appendChild(span);
    }
}

function setupTextAnimation() {
    splitTextIntoSpans('animatedTitle');
    animateLogoText();
}

function animateLogoText() {
    const logoSpans = document.querySelectorAll('#animatedTitle span');
    const lastSpanIndex = logoSpans.length - 1;

    logoSpans.forEach((span, index) => {
        animateSpan(span, index, lastSpanIndex);
    });
}

function animateSpan(span, index, lastSpanIndex) {
    gsap.to(span, {
        opacity: 1,
        duration: 0.5,
        delay: index * 0.05,
        ease: "power1.inOut",
        onComplete: () => {
            addGlowEffect(span);
            if (index === lastSpanIndex) {
                animateButtons();
            }
        }
    });
}

function addEnhancedGlowEffect(span) {
    const glowTimeline = gsap.timeline({ repeat: -1, yoyo: true });
    
    glowTimeline.to(span, {
        textShadow: "0 0 10px #fff, 0 0 20px #ff00de, 0 0 30px #ff00de",
        duration: 1,
        ease: "sine.inOut"
    }).to(span, {
        textShadow: "0 0 5px #fff, 0 0 10px #ff00de",
        duration: 1,
        ease: "sine.inOut"
    });
}

// Modify the existing addGlowEffect function
function addGlowEffect(span) {
    addEnhancedGlowEffect(span); // Use the enhanced glow effect
}

function animateButtons() {
    gsap.to('.button-container, .credit', {
        opacity: 1,
        y: 0,
        duration: 1,
        delay: 0.5,
        ease: "power2.out",
        stagger: 0.5
    });
}

// Animate the title on page load
function animateTitleEntrance() {
    const titleElement = document.getElementById('animatedTitle');
    gsap.from(titleElement, {
        duration: 1.5,
        y: -50,
        opacity: 0,
        ease: "power3.out"
    });
}

// Add scaling animation on hover
function addTitleHoverEffect() {
    const titleElement = document.getElementById('animatedTitle');
    
    titleElement.addEventListener('mouseover', () => {
        gsap.to(titleElement, { scale: 1.2, duration: 0.3, ease: "power1.out" });
    });

    titleElement.addEventListener('mouseout', () => {
        gsap.to(titleElement, { scale: 1, duration: 0.3, ease: "power1.out" });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    Object.entries(objectCounts).forEach(([className, count]) => {
        const speedMultiplier = {
            planet: 0.5,
            asteroid: 1.5,
            galaxy: 0.2,
            shikanoko: 0.3
        }[className] || 1;
        createSpaceObject(className, count, speedMultiplier);
    });

    setupTextAnimation();
    animateTitleEntrance(); // Call the entrance animation
    addTitleHoverEffect();   // Add hover effects to the title
});