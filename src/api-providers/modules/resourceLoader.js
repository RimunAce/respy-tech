import { providerImageExtensions } from './imageConfig.js';

const imageCache = new Map();

export const ResourceLoader = {
    async preloadImages(urls) {
        const promises = urls.map(url => {
            if (imageCache.has(url)) {
                return Promise.resolve(imageCache.get(url));
            }
            
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    imageCache.set(url, img);
                    resolve(img);
                };
                img.onerror = reject;
                img.src = url;
            });
        });
        
        return Promise.all(promises);
    },

    async preloadProviderIcons(providers) {
        const iconUrls = providers.map(provider => 
            `../assets/icons/${provider}.${providerImageExtensions[provider]}`
        );
        return this.preloadImages(iconUrls);
    },

    clearCache() {
        imageCache.clear();
    }
};

export const lazyLoadImage = (target) => {
    const io = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const src = img.getAttribute('data-src');
                if (src) {
                    img.src = src;
                    img.removeAttribute('data-src');
                }
                observer.disconnect();
            }
        });
    });

    io.observe(target);
};