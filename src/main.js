import { CubeAnimation } from './three-animation.js';

const pages = document.querySelectorAll('.page');
const navLinks = document.querySelectorAll('.nav-link');
const overlay = document.querySelector('.transition-overlay');
const copyButton = document.querySelector('.copy-button');
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navContainer = document.querySelector('.nav-links');
let isTransitioning = false;
let isMobileMenuOpen = false;

async function transition(pageId) {
    if (isTransitioning) return;
    isTransitioning = true;

    const currentPage = document.querySelector('.page.active');
    const nextPage = document.querySelector(pageId);

    if (currentPage === nextPage) {
        isTransitioning = false;
        return;
    }

    // Prepare next page
    nextPage.style.display = 'flex';

    // Slide overlay up
    overlay.style.transform = 'translateY(0)';
    overlay.style.transition = 'transform 0.7s var(--ease)';

    await new Promise(resolve => setTimeout(resolve, 700));

    // Switch pages
    currentPage.classList.remove('active');
    nextPage.classList.add('active');

    // Slide overlay down
    overlay.style.transform = 'translateY(-100%)';

    await new Promise(resolve => setTimeout(resolve, 700));

    // Reset overlay position
    overlay.style.transition = 'none';
    overlay.style.transform = 'translateY(100%)';

    // Clean up
    currentPage.style.display = '';
    isTransitioning = false;
}

// Event Listeners for Navigation Links
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const pageId = link.getAttribute('href');
        transition(pageId);
    });
});

// Enhanced copy functionality
function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        document.execCommand('copy');
        return true;
    } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
        return false;
    } finally {
        document.body.removeChild(textArea);
    }
}

async function copyTextToClipboard(text) {
    if (!navigator.clipboard) {
        return fallbackCopyTextToClipboard(text);
    }

    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Failed to copy text: ', err);
        return fallbackCopyTextToClipboard(text);
    }
}

// Event Listener for Copy Button
copyButton.addEventListener('click', async () => {
    const success = await copyTextToClipboard('contact@respy.tech');
    if (success) {
        copyButton.classList.add('copied');
        const originalText = copyButton.textContent;
        copyButton.textContent = 'Copied!';
        
        setTimeout(() => {
            copyButton.classList.remove('copied');
            copyButton.textContent = originalText;
        }, 2000);
    }
});

// Mobile Menu System
function initializeMobileMenu() {
    // Set initial state
    navContainer.style.display = window.innerWidth <= 768 ? 'none' : 'flex';
    
    function openMobileMenu() {
        navContainer.style.display = 'flex';
        navContainer.style.flexDirection = 'column';
        navContainer.style.alignItems = 'center';
        navContainer.style.gap = '1.5rem';
        navContainer.style.transform = 'translateY(-20px)';
        navContainer.style.opacity = '0';
        
        // Trigger animation
        requestAnimationFrame(() => {
            navContainer.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            navContainer.style.transform = 'translateY(0)';
            navContainer.style.opacity = '1';
        });
        
        // Animate nav links
        navLinks.forEach((link, index) => {
            link.style.opacity = '0';
            link.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                link.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                link.style.opacity = '1';
                link.style.transform = 'translateY(0)';
            }, 100 + (index * 50));
        });
        
        mobileMenuBtn.classList.add('active');
        isMobileMenuOpen = true;
    }

    function closeMobileMenu() {
        navContainer.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        navContainer.style.transform = 'translateY(-20px)';
        navContainer.style.opacity = '0';
        
        // Animate nav links out
        navLinks.forEach((link, index) => {
            link.style.transition = 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
            link.style.opacity = '0';
            link.style.transform = 'translateY(-10px)';
        });
        
        setTimeout(() => {
            if (!isMobileMenuOpen) { // Check if menu should still be closed
                navContainer.style.display = 'none';
                // Reset styles for desktop view
                navLinks.forEach(link => {
                    link.style.opacity = '';
                    link.style.transform = '';
                    link.style.transition = '';
                });
            }
        }, 300);
        
        mobileMenuBtn.classList.remove('active');
        isMobileMenuOpen = false;
    }

    // Mobile Menu Button Click
    mobileMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isMobileMenuOpen) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    });

    // Close menu when clicking navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768 && isMobileMenuOpen) {
                closeMobileMenu();
            }
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && 
            isMobileMenuOpen && 
            !e.target.closest('.nav-links') && 
            !e.target.closest('.mobile-menu-btn')) {
            closeMobileMenu();
        }
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            navContainer.style.display = 'flex';
            navContainer.style.opacity = '1';
            navContainer.style.transform = '';
            navContainer.style.flexDirection = 'row';
            navContainer.style.transition = '';
            // Reset nav links styles
            navLinks.forEach(link => {
                link.style.opacity = '';
                link.style.transform = '';
                link.style.transition = '';
            });
            mobileMenuBtn.classList.remove('active');
            isMobileMenuOpen = false;
        } else if (!isMobileMenuOpen) {
            navContainer.style.display = 'none';
        }
    });
}

// Initialize mobile menu system
initializeMobileMenu();

document.addEventListener('DOMContentLoaded', () => {
    // Only initialize Three.js animation for desktop
    if (window.innerWidth >= 1024) {
        const cubeAnimation = new CubeAnimation();
        const homeContent = document.querySelector('#home .content');
        const animationContainer = document.createElement('div');
        animationContainer.className = 'animation-container';
        animationContainer.appendChild(cubeAnimation.getRenderer());
        homeContent.appendChild(animationContainer);
    }
});
