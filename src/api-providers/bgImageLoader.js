document.addEventListener('DOMContentLoaded', function() {
    const bgContainer = document.createElement('div');
    bgContainer.className = 'background-container';
    document.body.appendChild(bgContainer);

    // Load background image
    const img = new Image();
    img.onload = function() {
        bgContainer.classList.add('loaded');
    };
    
    // Load image with lower quality for mobile
    if (window.innerWidth <= 768) {
        img.src = '../assets/background/bg2.png';
    } else {
        img.src = '../assets/background/bg2.png';
    }
});
