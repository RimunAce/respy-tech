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
import { PerformanceManager } from './modules/performanceManager.js';

let modelCountElement;
let currentProvider = 'rimunace';
let modelData = [];
let isInitialized = false;

const fetchWithRetry = async (url, maxRetries = 3, delay = 1000) => {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            lastError = error;
            console.warn(`Attempt ${i + 1} failed for ${url}:`, error.message);
            
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
            }
        }
    }
    
    throw new Error(`Failed after ${maxRetries} attempts: ${lastError.message}`);
};

const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
};

function initializeScrollToTop() {
    const scrollToTopButton = document.getElementById('scrollToTop');
    if (!scrollToTopButton) return;

    window.addEventListener('scroll', () => {
        const scrollPosition = window.scrollY || document.documentElement.scrollTop;
        const shouldShowButton = scrollPosition > 100;
        
        if (shouldShowButton) {
            scrollToTopButton.style.display = "block";
            scrollToTopButton.style.opacity = "1";
        } else {
            scrollToTopButton.style.opacity = "0";
            setTimeout(() => {
                if (scrollPosition <= 100) {
                    scrollToTopButton.style.display = "none";
                }
            }, 300);
        }
    });

    scrollToTopButton.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

function disableAllButtons(disabled) {
    document.querySelectorAll('button, .api-button, .view-button').forEach(button => {
        button.disabled = disabled;
        button.style.opacity = disabled ? '0.5' : '1';
        button.style.cursor = disabled ? 'not-allowed' : 'pointer';
    });
}

document.addEventListener('DOMContentLoaded', async function () {
    disableAllButtons(true);
    
    const elements = {
        modelContainer: document.getElementById('modelContainer'),
        loadingElement: document.getElementById('loading'),
        modelCountElement: document.getElementById('modelCount'),
        apiDescription: document.getElementById('apiDescription')
    };
    const providerInfoBox = document.getElementById('providerInfoBox');

    try {
        if (!elements.modelContainer || !elements.loadingElement || 
            !elements.modelCountElement || !providerInfoBox || 
            !elements.apiDescription) {
            throw new Error('Required DOM elements not found');
        }

        window.modelContainer = elements.modelContainer;
        
        initializeScrollToTop();
        
        setLoadingState(true, elements);
        
        // Initialize default provider UI
        const defaultProvider = 'rimunace';
        renderProviderInfo(ownerInfo[defaultProvider], providerInfoBox);
        updateRating(defaultProvider);
        updateApiDescription(defaultProvider);
        
        // Fetch all models and handle the results
        const allModels = await fetchAllModels();
        if (allModels[defaultProvider]?.length > 0) {
            modelData = allModels[defaultProvider];
            displayModels();
        }
        
        setLoadingState(false, elements);
        elements.apiDescription.classList.remove('loading');
        isInitialized = true;
        disableAllButtons(false);
        
    } catch (error) {
        console.error('Error initializing application:', error);
        
        if (elements.loadingElement) {
            elements.loadingElement.innerHTML = `
                <div class="error-message">
                    <p>Error initializing application. Please refresh the page.</p>
                </div>
            `;
        }
    }
});

async function fetchAllModels() {
    const results = {};
    const errorMessages = new Map();
    const modelContainer = document.getElementById('modelContainer');
    
    const fetchResults = await Promise.all(
        providers.map(provider => fetchProviderData(provider, results, errorMessages))
    );
    
    if (!results.rimunace || results.rimunace.length === 0) {
        try {
            const response = await fetchWithRetry('/.netlify/functions/api-handler/rimunace');
            results.rimunace = response.data || [];
        } catch (error) {
            console.error('Failed to fetch Rimunace data:', error);
            results.rimunace = [];
        }
    }
    
    const failedProviders = Object.values(results).filter(arr => arr.length === 0).length;
    
    if (failedProviders === providers.length) {
        throw new Error('All providers failed to respond');
    }
    
    if (errorMessages.size > 0) {
        displayWarning(errorMessages, modelContainer);
    }
    
    return results;
}

async function fetchProviderData(provider, results, errorMessages) {
    try {
        const response = await fetchWithRetry(`/.netlify/functions/api-handler/${provider}`);
        results[provider] = response.data || [];
        return response;
    } catch (error) {
        console.error(`Error fetching ${provider}:`, error);
        errorMessages.set(provider, error.message);
        results[provider] = [];
        return null;
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
    const localModelCountElement = document.getElementById('modelCount');
    
    function shouldDisplayModel(model, filterWords) {
        return !filterWords.length || filterWords.every(word => 
            model.id?.toLowerCase().includes(word) || 
            model.owned_by?.toLowerCase().includes(word)
        );
    }

    const observer = createIntersectionObserver();
    let visibleCount = 0;
    const batchSize = window.innerWidth <= 768 ? 10 : 20;
    let currentIndex = 0;
    
    function renderModelBox(model) {
        if (!shouldDisplayModel(model, filterWords)) return null;
        const modelBox = createModelBox(model, currentProvider);
        modelBox.style.opacity = '0';
        observer.observe(modelBox);
        return modelBox;
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
        
        if (localModelCountElement) {
            localModelCountElement.textContent = visibleCount;
        }
        adjustLayout(modelContainer);
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

    const provider = getProviderFromButton(button);
    const modelContainer = document.getElementById('modelContainer');
    const modelCountElement = document.getElementById('modelCount');
    
    modelContainer.innerHTML = `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <div class="loading-text">Loading ${provider} models...</div>
        </div>
    `;
    modelCountElement.textContent = '...';

    try {
        updateProviderMetadata(provider);
        const modelsPromise = fetchProviderModels(provider);
        await updateProviderInfo(provider);
        const models = await modelsPromise;
        modelData = models;
        displayModels();
    } catch (error) {
        console.error('Error switching provider:', error);
        modelContainer.innerHTML = `
            <div class="error-container">
                <div class="error-message">
                    Failed to load models. Please try again.
                    <button class="retry-button" data-provider="${provider}">Retry</button>
                </div>
            </div>
        `;
        
        // Add event listener for retry button
        const retryButton = modelContainer.querySelector('.retry-button');
        if (retryButton) {
            retryButton.addEventListener('click', handleRetryClick);
        }
    }
}

function updateProviderMetadata(provider) {
    document.querySelectorAll('.api-button').forEach(btn => 
        btn.classList.toggle('active', btn.dataset.api === provider)
    );
    currentProvider = provider;
    updateRating(provider);
    updateApiDescription(provider);
}

async function updateProviderInfo(provider) {
    const owner = ownerInfo[provider];
    const providerInfoBox = document.getElementById('providerInfoBox');
    
    if (owner) {
        renderProviderInfo(owner, providerInfoBox);
    } else if (provider === 'rimunace') {
        renderProviderInfo(ownerInfo.rimunace, providerInfoBox);
    }
}

async function fetchProviderModels(provider) {
    const cachedModels = getCachedData('allModels');
    if (isCacheValid(cachedModels, provider)) {
        return cachedModels[provider];
    }

    const response = await fetch(`/.netlify/functions/api-handler/${provider}`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const { data, source } = await response.json();
    
    if (source === 'api') {
        const allModels = { ...getCachedData('allModels'), [provider]: data };
        setCachedData('allModels', allModels);
    }
    
    return data;
}

function shouldIgnoreClick(button) {
    return (
        !button ||
        button.classList.contains('active') ||
        isLoading ||
        !isInitialized
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
    const providerInfoBox = document.getElementById('providerInfoBox');
    
    if (!owner && provider === 'rimunace') {
        renderProviderInfo(ownerInfo.rimunace, providerInfoBox);
    } else {
        renderProviderInfo(owner, providerInfoBox);
    }
    
    const cachedModels = getCachedData('allModels');
    if (isCacheValid(cachedModels, provider)) {
        modelData = cachedModels[provider];
        displayModels();
    } else {
        const allModels = await fetchAllModels();
        setCachedData('allModels', allModels);
        handleModelFetchResult(allModels, provider);
    }

    const apiDescription = document.getElementById('apiDescription');
    apiDescription.classList.remove('loading');
    apiDescription.textContent = apiDescriptions[provider] || 'No description available';
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

const performanceManager = new PerformanceManager();

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

window.addEventListener('resize', debounce(() => {
    adjustLayout(modelContainer);
}, 250));

async function handleRetryClick(event) {
    const button = event.currentTarget;
    const provider = button.dataset.provider;
    if (!provider) return;

    const modelContainer = document.getElementById('modelContainer');
    
    modelContainer.innerHTML = `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <div class="loading-text">Loading ${provider} models...</div>
        </div>
    `;

    try {
        const models = await fetchProviderModels(provider);
        modelData = models;
        displayModels();
    } catch (error) {
        console.error('Retry failed:', error);
        modelContainer.innerHTML = `
            <div class="error-container">
                <div class="error-message">
                    Failed to load models. Please try again.
                    <button class="retry-button" data-provider="${provider}">Retry</button>
                </div>
            </div>
        `;
        
        // Reattach event listener to new retry button
        const newRetryButton = modelContainer.querySelector('.retry-button');
        if (newRetryButton) {
            newRetryButton.addEventListener('click', handleRetryClick);
        }
    }
}
