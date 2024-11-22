const titles = ["AI Generative Text Models", "AI Generative Image Models", "AI Generative Audio Models"];
const colors = ["linear-gradient(45deg, #ff00cc, #3333ff)", "linear-gradient(45deg, #00ff99, #00ccff)", "linear-gradient(45deg, #ff9900, #ff3300)"];
let currentTitleIndex = 0;

function animateTitle() {
    const titleElement = document.getElementById('dynamicTitle');
    const currentTitle = titles[currentTitleIndex];
    const nextTitle = titles[(currentTitleIndex + 1) % titles.length];
    const currentColor = colors[currentTitleIndex];
    const nextColor = colors[(currentTitleIndex + 1) % colors.length];

    titleElement.style.backgroundImage = currentColor;
    deleteTitle(titleElement, currentTitle);
}

function deleteTitle(titleElement, currentTitle) {
    let i = currentTitle.length;
    const deleteInterval = setInterval(() => {
        if (i > 0) {
            titleElement.textContent = currentTitle.substring(0, i - 1);
            i--;
        } else {
            clearInterval(deleteInterval);
            typeTitle(titleElement, currentTitle);
        }
    }, 50);
}

function typeTitle(titleElement, currentTitle) {
    const nextTitle = titles[(currentTitleIndex + 1) % titles.length];
    const nextColor = colors[(currentTitleIndex + 1) % colors.length];

    titleElement.style.backgroundImage = nextColor;

    let j = 0;
    const typeInterval = setInterval(() => {
        if (j <= nextTitle.length) {
            titleElement.textContent = nextTitle.substring(0, j);
            j++;
        } else {
            clearInterval(typeInterval);
            currentTitleIndex = (currentTitleIndex + 1) % titles.length;
            setTimeout(animateTitle, 1500);
        }
    }, 50);
}

function animateInitialTitle() {
    const titleElement = document.getElementById('dynamicTitle');
    const initialTitle = titles[0];
    const initialColor = colors[0];

    titleElement.style.backgroundImage = initialColor;
    titleElement.textContent = '';

    typeInitialTitle(titleElement, initialTitle);
}

function typeInitialTitle(titleElement, initialTitle) {
    let i = 0;
    const typeInterval = setInterval(() => {
        if (i <= initialTitle.length) {
            titleElement.textContent = initialTitle.substring(0, i);
            i++;
        } else {
            clearInterval(typeInterval);
            setTimeout(animateTitle, 1500);
        }
    }, 50);
}

export {
    animateTitle,
    animateInitialTitle
};