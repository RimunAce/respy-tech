document.addEventListener('DOMContentLoaded', function() {
    const bgContainer = document.createElement('div');
    bgContainer.className = 'background-container';
    document.body.appendChild(bgContainer);

    const img = new Image();
    img.onload = function() {
        bgContainer.classList.add('loaded');
    };
    
    // Use smaller image for mobile
    if (window.innerWidth <= 768) {
        img.src = '../assets/background/bgavif-mobile.avif';
    } else {
        img.src = '../assets/background/bgavif.avif';
    }
});
