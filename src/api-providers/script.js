import { providerRatings, providerRatingsComment, ownerInfo } from './modules/providerInfo.js';
import { apiDescriptions, providers } from './modules/providerConfig.js';
import { contentGenerators } from './modules/contentGenerators.js';
import { getCachedData, setCachedData } from './modules/cacheManager.js';
import { 
    setLoadingState, 
    setButtonsState, 
    updateRating, 
    updateApiDescription, 
    displayError,
    displayWarning,
    renderProviderInfo,
    adjustLayout
} from './modules/uiManager.js';
import { ResourceLoader, lazyLoadImage } from './modules/resourceLoader.js';
import { providerImageExtensions } from './modules/imageConfig.js';

document.addEventListener('DOMContentLoaded', async function () {
    let modelData = [];
    let currentProvider = 'rimunace';

    const modelContainer = document.getElementById('modelContainer');
    const modelCountElement = document.getElementById('modelCount');
    const loadingElement = document.getElementById('loading');
    const searchInput = document.getElementById('searchInput');
    const scrollToTopButton = document.getElementById('scrollToTop');
    const apiDescription = document.getElementById('apiDescription');
    const providerInfoBox = document.getElementById('providerInfoBox');

    async function fetchAllModels() {
        const results = {};
        const errorMessages = new Map();
    
        const fetchResults = await Promise.all(
            providers.map(provider => fetchProviderData(provider, results, errorMessages))
        );
    
        const failedProviders = Object.values(results).filter(arr => arr.length === 0).length;
        
        if (failedProviders === providers.length) {
            throw new Error('All providers failed to respond');
        }
    
        if (errorMessages.size > 0) {
            displayWarning(errorMessages);
        }
    
        return results;
    }
    
    async function fetchProviderData(provider, results, errorMessages) {
        try {
            const data = await fetchWithRetry(`/.netlify/functions/api-handler/${provider}`);
            if (!Array.isArray(data?.data)) {
                throw new Error('Invalid data format received');
            }
            results[provider] = data.data;
        } catch (error) {
            errorMessages.set(provider, error.message);
            results[provider] = [];
            console.error(`Error fetching ${provider}:`, error);
        }
    }

    function createModelBox(model, apiProvider) {
        const modelBox = document.createElement('div');
        modelBox.className = 'model-box';

        const modelIdElement = createModelIdElement(model);
        const modelDetailsElement = createModelDetailsElement(model, apiProvider);

        modelBox.appendChild(modelIdElement);
        modelBox.appendChild(modelDetailsElement);

        const copyButton = createCopyButton(model);
        modelBox.appendChild(copyButton);

        return modelBox;
    }

    function createModelIdElement(model) {
        const modelIdElement = document.createElement('div');
        modelIdElement.className = 'model-id';
        modelIdElement.textContent = model.id;
        return modelIdElement;
    }

    function safeContentGenerator(generator, model) {
        try {
            return generator(model);
        } catch (error) {
            console.error(`Error generating content:`, error);
            return `
                <p>Error: Unable to display model details</p>
                <p>ID: ${model.id || 'Unknown'}</p>
            `;
        }
    }

    function createModelDetailsElement(model, apiProvider) {
        const modelDetailsElement = document.createElement('div');
        modelDetailsElement.className = 'model-details';
    
        try {
            const contentGenerator = contentGenerators[apiProvider] || (() => '');
            const content = safeContentGenerator(contentGenerator, model);
            modelDetailsElement.innerHTML = content;
        } catch (error) {
            console.error('Error creating model details:', error);
            modelDetailsElement.innerHTML = '<p>Error loading model details</p>';
        }
    
        return modelDetailsElement;
    }

    function createCopyButton(model) {
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-button';
        copyButton.title = 'Copy Model ID';
        const tooltip = document.createElement('span');
        tooltip.className = 'tooltip';
        tooltip.textContent = 'Copy Model ID';
        copyButton.appendChild(tooltip);

        copyButton.onclick = function() {
            navigator.clipboard.writeText(model.id).then(() => {
                copyButton.classList.add('copied');
                tooltip.textContent = 'Copied!';
                tooltip.style.opacity = '1';
                setTimeout(() => {
                    copyButton.classList.remove('copied');
                    tooltip.textContent = 'Copy Model ID';
                    tooltip.style.opacity = '0';
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy:', err);
            });
        };
        return copyButton;
    }

    function displayModels(filter = '') {
        const fragment = document.createDocumentFragment();
        const filterWords = filter.toLowerCase().trim().split(/\s+/);
        modelContainer.innerHTML = '';
        
        const observer = createIntersectionObserver();
        let visibleCount = 0;
        const batchSize = 20;
        let currentIndex = 0;
    
        function renderModelBox(model) {
            if (!shouldDisplayModel(model, filterWords)) return null;
            const modelBox = createModelBox(model, currentProvider);
            modelBox.style.opacity = '0';
            observer.observe(modelBox);
            return modelBox;
        }
    
        function shouldDisplayModel(model, filterWords) {
            return !filterWords.length || filterWords.every(word => 
                model.id?.toLowerCase().includes(word) || 
                model.owned_by?.toLowerCase().includes(word)
            );
        }
    
        function renderBatch() {
            const endIndex = Math.min(currentIndex + batchSize, modelData.length);
            const batchFragment = document.createDocumentFragment();
            
            for (let i = currentIndex; i < endIndex; i++) {
                const modelBox = renderModelBox(modelData[i]);
                if (modelBox) {
                    batchFragment.appendChild(modelBox);
                    visibleCount++;
                }
            }
            
            modelContainer.appendChild(batchFragment);
            currentIndex = endIndex;
            
            if (currentIndex < modelData.length) {
                requestAnimationFrame(renderBatch);
            }
            
            modelCountElement.textContent = visibleCount;
        }
    
        requestAnimationFrame(renderBatch);
    }

    function createIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        });
        return observer;
    }

    function preloadAvatars() {
        const avatarUrls = new Set();
        Object.values(ownerInfo).forEach(owner => {
            owner.avatars.forEach(avatar => avatarUrls.add(avatar));
        });
    }

    window.addEventListener('load', function () {
        preloadAvatars();
    });

    const debounce = (func, delay) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func(...args), delay);
        };
    };
    
    const debouncedDisplayModels = debounce((filter) => {
        displayModels(filter);
    }, 300);
    
    searchInput.addEventListener('input', (e) => {
        debouncedDisplayModels(e.target.value);
    });

    let isLoading = false;

    document.querySelector('.api-buttons').addEventListener('click', handleApiButtonClick);

    async function handleApiButtonClick(event) {
        const button = event.target.closest('.api-button');
        if (shouldIgnoreClick(button)) return;

        const elements = {
            modelContainer,
            modelCountElement,
            loadingElement,
            apiDescription
        };

        setLoadingState(true, elements);
        try {
            const provider = getProviderFromButton(button);
            await updateProviderUI(provider);
        } finally {
            setLoadingState(false, elements);
        }
    }

    function shouldIgnoreClick(button) {
        return (
            !button ||
            button.classList.contains('active') ||
            isLoading
        );
    }

    function getProviderFromButton(button) {
        const previousActive = document.querySelector('.api-button.active');
        previousActive?.classList.remove('active');
        button.classList.add('active');

        const provider = button.dataset.api;
        currentProvider = provider;
        updateRating(provider);
        return provider;
    }

    async function updateProviderUI(provider) {
        const owner = ownerInfo[provider];
        renderProviderInfo(owner, providerInfoBox);
        
        const cachedModels = getCachedData('allModels');
        if (isCacheValid(cachedModels, provider)) {
            modelData = cachedModels[provider];
            displayModels();
        } else {
            const allModels = await fetchAllModels();
            setCachedData('allModels', allModels);
            handleModelFetchResult(allModels, provider);
        }

        apiDescription.classList.remove('loading');
        apiDescription.textContent = apiDescriptions[provider];
    }

    function handleModelFetchResult(allModels, provider) {
        if (allModels[provider] === 'error') {
            displayError('Error Fetching Models. Try Refreshing');
            modelCountElement.textContent = '0';
        } else {
            modelData = allModels[provider] || [];
            displayModels();
        }
    }

    window.addEventListener('scroll', () => {
        const scrollPosition = window.scrollY || document.documentElement.scrollTop;
        const shouldShowButton = scrollPosition > 100;
        
        if (shouldShowButton) {
            scrollToTopButton.style.display = "block";
            scrollToTopButton.style.opacity = "1";
        } else {
            scrollToTopButton.style.opacity = "0";
            setTimeout(() => {
                if (!shouldShowButton) {
                    scrollToTopButton.style.display = "none";
                }
            }, 300);
        }
    });

    scrollToTopButton.addEventListener("click", function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    (async () => {
        try {
            loadingElement.style.display = 'block';
            setButtonsState(true);
            providerInfoBox.innerHTML = 'Loading...';
            apiDescription.classList.add('loading');
            apiDescription.textContent = 'Loading...';

            const cachedAllModels = getCachedData('allModels');
            if (cachedAllModels) {
                modelData = cachedAllModels[currentProvider] || [];
                displayModels();
            } else {
                const allModels = await fetchAllModels();
                setCachedData('allModels', allModels);
                modelData = allModels[currentProvider] || [];
                displayModels();
            }

            const owner = ownerInfo[currentProvider];
            updateProviderInfo(owner);
            
            apiDescription.classList.remove('loading');
            apiDescription.textContent = apiDescriptions[currentProvider];
            updateRating('rimunace');
        } catch (error) {
            console.error('Error loading models:', error);
            providerInfoBox.innerHTML = 'Error loading provider information';
            apiDescription.textContent = 'Error loading provider information';
        } finally {
            loadingElement.style.display = 'none';
            setButtonsState(false);
        }
    })();

    function updateProviderInfo(owner) {
        providerInfoBox.innerHTML = `
            <h2>${owner.description}</h2>
            <div class="provider-avatars">
                ${owner.avatars.map(avatar => `<img src="${avatar}" alt="Owner Avatar" class="provider-avatar" loading="lazy">`).join('')}
            </div>
            <div class="provider-details">
                <div class="provider-buttons">
                    ${owner.links.map(link => `
                        <a href="${link.url}" class="provider-button ${link.color}" target="_blank" rel="noopener noreferrer">
                            <img src="${link.icon}" alt="${link.text} Icon" loading="lazy"> ${link.text}
                        </a>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    async function updateRedisStatus() {
        const redisStatus = document.getElementById('redisStatus');
        try {
            const response = await fetch('/.netlify/functions/check-cache');
            const { connected } = await response.json();
            
            redisStatus.textContent = connected ? 'Connected' : 'Disconnected';
            redisStatus.className = connected ? 'connected' : 'disconnected';
        } catch (error) {
            redisStatus.textContent = 'Disconnected';
            redisStatus.className = 'disconnected';
        }
    }

    updateRedisStatus();
    setInterval(updateRedisStatus, 60000);

    function updateProvidersTotal() {
        const providersTotal = document.getElementById('providersTotal');
        const totalProviders = Object.keys(ownerInfo).length;
        providersTotal.textContent = totalProviders;
    }

    updateProvidersTotal();

    // Preload provider icons
    await ResourceLoader.preloadProviderIcons(providers);
    
    // Initialize lazy loading for provider avatars
    document.querySelectorAll('.provider-avatar[data-src]').forEach(lazyLoadImage);
});

const fetchWithRetry = async (url, maxRetries = 3, delay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        }
    }
};

function isCacheValid(cachedData, provider) {
    return (
        cachedData && 
        typeof cachedData === 'object' && 
        Array.isArray(cachedData[provider]) && 
        cachedData[provider].length > 0
    );
}

function getProviderIconPath(provider) {
    const extension = providerImageExtensions[provider];
    return `../assets/icons/${provider}.${extension}`;
}

function createProviderButton(provider) {
    return `
        <button class="api-button" data-api="${provider}">
            <img src="${getProviderIconPath(provider)}" alt="${provider}" class="provider-icon">
            ${provider}
        </button>
    `;
}
