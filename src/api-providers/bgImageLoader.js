document.addEventListener('DOMContentLoaded', function() {
    const bgContainer = document.createElement('div');
    bgContainer.className = 'background-container';
    document.body.appendChild(bgContainer);

    const img = new Image();
    img.onload = function() {
        bgContainer.classList.add('loaded');
        document.body.style.backgroundImage = `url(${img.src})`;
    };
    
    // Use smaller image for mobile
    if (window.innerWidth <= 768) {
        img.src = '../assets/background/bgavif-mobile.avif';
    } else {
        img.src = '../assets/background/bgavif.avif';
    }

    // Handle resize events
    window.addEventListener('resize', function() {
        const newSrc = window.innerWidth <= 768 
            ? '../assets/background/bgavif-mobile.avif'
            : '../assets/background/bgavif.avif';
        if (img.src !== newSrc) {
            img.src = newSrc;
        }
    });
});
