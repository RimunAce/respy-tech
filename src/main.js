// Animated background
const bg = document.querySelector('.animated-bg');
const objectCounts = {
    star: 200,
    planet: 3,
    asteroid: 10,
    galaxy: 2,
    shikanoko: 1
};

function createSpaceObject(className, count, speedMultiplier = 1) {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
        const obj = createSpaceObjectElement(className);
        setSpaceObjectStyle(obj, className);
        fragment.appendChild(obj);
        animateObject(obj, speedMultiplier, className);
    }
    bg.appendChild(fragment);
}

function animateObject(obj, speedMultiplier, className) {
    const speed = (0.05 + Math.random() * 0.05) * speedMultiplier;
    let currentTop = parseFloat(obj.style.top);
    
    function move() {
        currentTop += speed;
        if (currentTop > 100) {
            currentTop = -5;
        }
        obj.style.top = `${currentTop}%`;
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

    Object.assign(obj.style, {
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        ...styleCreators[className]()
    });
}

function createPlanetStyle() {
    const size = 20 + Math.random() * 30;
    const hue = Math.random() * 360;
    return {
        width: `${size}px`,
        height: `${size}px`,
        background: `radial-gradient(circle at 30% 30%, hsl(${hue}, 70%, 50%), #000)`
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

function updatePosition(currentTop, speed) {
    currentTop += speed;
    if (currentTop > 100) {
        currentTop = -5;
    }
    return currentTop;
}

function resetObjectPosition(obj, className) {
    obj.style.left = `${Math.random() * 100}%`;
    if (className === './images/shikanoko.png') {
        obj.style.display = Math.random() < 0.2 ? 'block' : 'none';
    }
}

function splitTextIntoSpans(elementId) {
    const element = document.getElementById(elementId);
    const text = element.textContent;
    element.textContent = '';
    
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '|') continue; // Skip the spacing indicator
        
        const span = document.createElement('span');
        span.textContent = text[i];
        span.setAttribute('data-text', text[i]);
        
        // Add extra class for characters before the spacing indicator
        if (i < text.length - 1 && text[i + 1] === '|') {
            span.classList.add('space-after');
        }
        
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

function addGlowEffect(span) {
    gsap.to(span, {
        textShadow: "0 0 10px #fff, 0 0 20px #fff, 0 0 30px #fff, 0 0 40px #ff00de, 0 0 70px #ff00de, 0 0 80px #ff00de, 0 0 100px #ff00de, 0 0 150px #ff00de",
        repeat: -1,
        yoyo: true,
        duration: 1.5,
        ease: "power1.inOut"
    });
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
});