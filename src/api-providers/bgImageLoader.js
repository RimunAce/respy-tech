window.addEventListener('load', function() {
    const bgImage = document.querySelector('.bg-image');
    const img = new Image();
    img.src = '../assets/background/bg.png';
    img.onload = function() {
        bgImage.classList.add('loaded');
    };
});
