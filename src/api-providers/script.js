const CACHE_DURATION = 5 * 60 * 1000;
const cache = new Map();


const apiDescriptions = {
    rimunace: 'This API is maintained by me (Respire) and with the help of James"without dot"',
    zanity: 'This API is made by Voidi, zukijourney\'s dev and has a good API support & stability',
    anyai: "This API doesn't require an API key for free tier user, a plug and play API",
    cablyai: "This API requires 10 valid invites to be used or behind a 20$ paywall (negotiable)",
    fresedgpt: "This API is very recommended for everyone but (some) Claude model requires payment",
    heckerai: "This API is made by a great mastermind, hecker. Dropped an announcement of winding down server and making it private starting 15th November 2024",
    shardai: "This API is made by yet another great mastermind(s), puzzy and quartz. No further comment needed",
    zukijourney: "This API is practically leading the API provider scene. Largest API provider with 5,700 members",
    shadowjourney: "This API is made by \"The Honoured One\" and for real, he might be Gojo Satoru himself",
    shuttleai: 'This API run with the basis of pay-as-you-go with a clean dashboard management and focus solely on own trained model',
    electronhub: 'This API recently changed to token based pricing and still provides a good stability and support',
    oxygen: 'This API has changed to pay-as-you-go and updated their dashboard layout. Still a good service nonetheless',
    nagaai: 'Based on https://cas.zukijourney.com, this API is a successor of ChimeraGPT, the largest API in history with 15k users',
    skailar: 'This API was never used by me but regardless, this api itself is in a good shape',
    helixmind: 'This API is very "professional"-like thanks to the charming owner. Owner\'s goal is to provide Stable and Reliable service',
    hareproxy: 'This API is pretty damn good with their stability and performance. Running on multiple endpoint for different corporate models. Recently released a unified endpoint',
    miraai: 'This API is made by several developers and has gone for pay-as-you-go concept. Starting from 0.25$ credit',
    webraftai: 'This API is made by DS_GAMER and made a return after a long recovery from illness. The API is once again in a great shape. The list here is fromt the v2 model list'
};

const getCachedData = (key) => {
    const cachedItem = cache.get(key);
    if (cachedItem && Date.now() - cachedItem.timestamp < CACHE_DURATION) {
        return cachedItem.data;
    }
    cache.delete(key);
    return null;
};

const setCachedData = (key, data) => {
    cache.set(key, { data, timestamp: Date.now() });
};

const cleanupCache = () => {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
        if (now - value.timestamp >= CACHE_DURATION) {
            cache.delete(key);
        }
    }
};

setInterval(cleanupCache, CACHE_DURATION);

document.addEventListener('DOMContentLoaded', function () {
    let modelData = [];
    let currentProvider = 'rimunace';

    // Cache DOM elements
    const modelContainer = document.getElementById('modelContainer');
    const modelCountElement = document.getElementById('modelCount');
    const loadingElement = document.getElementById('loading');
    const searchInput = document.getElementById('searchInput');
    const scrollToTopButton = document.getElementById('scrollToTop');
    const apiDescription = document.getElementById('apiDescription');
    const providerInfoBox = document.getElementById('providerInfoBox');

    async function fetchAllModels() {
        const providers = [
            'rimunace', 'zanity', 'anyai', 'cablyai', 'fresedgpt', 
            'heckerai', 'shardai', 'zukijourney', 'shadowjourney', 
            'shuttleai', 'electronhub', 'oxygen', 'nagaai', 'skailar', 
            'helixmind', 'hareproxy', 'miraai', 'webraftai'
        ];
        
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

    function displayWarning(errorMessages) {
        const warningDiv = document.createElement('div');
        warningDiv.className = 'warning-message';
        
        const summary = document.createElement('div');
        summary.textContent = `${errorMessages.size} providers are currently unavailable`;
        warningDiv.appendChild(summary);
    
        if (errorMessages.size > 0) {
            const details = document.createElement('div');
            details.className = 'warning-details';
            details.style.display = 'none';
            
            errorMessages.forEach((message, provider) => {
                const providerError = document.createElement('div');
                providerError.textContent = `${provider}: ${message}`;
                details.appendChild(providerError);
            });
            
            const toggleButton = document.createElement('button');
            toggleButton.textContent = 'Show Details';
            toggleButton.onclick = () => {
                details.style.display = details.style.display === 'none' ? 'block' : 'none';
                toggleButton.textContent = details.style.display === 'none' ? 'Show Details' : 'Hide Details';
            };
            
            warningDiv.appendChild(toggleButton);
            warningDiv.appendChild(details);
        }
    
        modelContainer.insertAdjacentElement('beforebegin', warningDiv);
        
        setTimeout(() => {
            warningDiv.style.opacity = '0';
            setTimeout(() => warningDiv.remove(), 500);
        }, 10000);
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

    function getContentGenerator(apiProvider) {
        return contentGenerators[apiProvider] || (() => '');
    }

    const contentGenerators = {
        rimunace: generateRimunaceContent,
        zanity: generateZanityContent,
        anyai: generateAnyaiContent,
        cablyai: generateCablyaiContent,
        fresedgpt: generateFresedgptContent,
        heckerai: generateHeckerContent,
        shardai: generateShardaiContent,
        zukijourney: generateZukijourneyContent,
        shadowjourney: generateShadowjourneyContent,
        shuttleai: generateShuttleaiContent,
        electronhub: generateElectronhubContent,
        oxygen: generateOxygenContent,
        nagaai: generateNagaaiContent,
        skailar: generateSkailarContent,
        helixmind: generateHelixmindContent,
        hareproxy: generateHareproxyContent,
        miraai: generateMiraaiContent,
        webraftai: generateWebraftaiContent
    };

    function generateRimunaceContent(model) {
        const accessTiers = Object.entries(model.access)
            .filter(([_, v]) => v)
            .map(([k]) => k.charAt(0).toUpperCase() + k.slice(1))
            .join(', ');

        return `
            <p>Type: ${model.type}</p>
            <p>Owner: ${model.owned_by}</p>
            <p>Cost: ${model.cost} / request</p>
            ${accessTiers ? `<p>Access: ${accessTiers}</p>` : ''}
            <p>Available: ${model.available ? 'Yes' : 'No'}</p>
            <p>Added: ${model.added}</p>
        `;
    }

    function generateZanityContent(model) {
        return `
            <p>Type: ${model.type}</p>
            <p>Owned by: ${model.owned_by}</p>
            <p>Cost: ${model.cost}</p>
            <p>Access: ${Object.entries(model.access)
                .filter(([k, v]) => v)
                .map(([k]) => k.charAt(0).toUpperCase() + k.slice(1))
                .join(', ') || 'None'}</p>
        `;
    }

    function generateAnyaiContent(model) {
        return `
            <p>Open Source: ${model.created === 0 ? 'Yes' : 'No'}</p>
            <p>Owner: ${model.owned_by}</p>
            <p>Object: ${model.object}</p>
        `;
    }

    function generateCablyaiContent(model) {
        return `
            <p>Owner: ${model.owned_by}</p>
            <p>Type: ${model.type}</p>
            <p>Vision Supported: ${model.support_vision ? 'Yes' : 'No'}</p>
        `;
    }

    function generateFresedgptContent(model) {
        return `
            <p>Owner: ${model.owned_by}</p>
            <p>Token Coefficient: ${model.token_coefficient}</p>
            <p>Max Tokens: ${model.max_tokens || 'N/A'}</p>
        `;
    }

    function generateHeckerContent(model) {
        return `
            <p>Owner: ${model.owned_by}</p>
            <p>AI API By: ${model["AI API by"]}</p>
        `;
    }

    function generateShardaiContent(model) {
        return `
            <p>Owner: ${model.owned_by}</p>
            <p>Type: ${model.type}</p>
            <p>Cost: ${model.cost}/1k tokens</p>
            <p>Max Tokens: ${model.max_tokens || 'N/A'}</p>
            <p>Access: ${Object.entries(model.access)
                .filter(([k, v]) => v)
                .map(([k]) => k.charAt(0).toUpperCase() + k.slice(1))
                .join(', ')}</p>
            ${model.note ? `<p>Note: ${model.note}</p>` : ''}
        `;
    }

    function generateZukijourneyContent(model) {
        return `
            <p>Owner: ${model.owned_by}</p>
            <p>Type: ${model.type}</p>
            <p>Supports Vision: ${model.supports_vision ? 'Yes' : 'No'}</p>
            <p>Is Free: ${model.is_free ? 'Yes' : 'No'}</p>
        `;
    }

    function generateShadowjourneyContent(model) {
        const cost = model.cost === "free" ? "False" : model.cost === "premium" ? "True" : "False";
        return `
            <p>Owned By: ${model.owned_by}</p>
            <p>Object: ${model.object}</p>
            <p>Premium: ${cost}</p>
        `;
    }

    function generateShuttleaiContent(model) {
        return `
            <p>Cost: ${model.cost ? model.cost : "N/A"}/req</p>
            <p>Model: ${model.object}</p>
            <p>Premium: ${model.premium ? model.premium : "N/A"}</p>
            <p>Owned: ${model.owned_by ? model.owned_by : "N/A"}</p>
        `;
    }

    function generateElectronhubContent(model) {
        return `
            <p>Object: ${model.object ? model.object : "N/A"}</p>
            <p>Owned By: ${model.owned_by ? model.owned_by : "N/A"}</p>
            <p>Max Tokens: ${model.tokens ? model.tokens : "N/A"}</p>
            <p>Created: ${model.created ? model.created : "N/A"}</p>
            <p>Premium Model: ${model.premium_model !== undefined ? (model.premium_model ? "Yes" : "No") : "N/A"}</p>
            <p>Vision: ${model.metadata?.vision !== undefined ? (model.metadata.vision ? "Yes" : "No") : "N/A"}</p>
            <p>Function Call: ${model.metadata?.function_call !== undefined ? (model.metadata.function_call ? "Yes" : "No") : "N/A"}</p>
            <p>Web Search: ${model.metadata?.web_search !== undefined ? (model.metadata.web_search ? "Yes" : "No") : "N/A"}</p>
            <p>Pricing Type: ${model.pricing?.type ? model.pricing.type : "N/A"}</p>
            <p>Pricing Coefficient: ${model.pricing?.coefficient ? model.pricing.coefficient : "N/A"}</p>
        `;
    }

    function generateOxygenContent(model) {
        return `
            <p>Name: ${model.name ? model.name : "N/A"}</p>
            <p>Owned By: ${model.owned_by ? model.owned_by : "N/A"}</p>
            <p>Type: ${model.type ? model.type : "N/A"}</p>
        `;
    }

    function generateNagaaiContent(model) {
        return `
            <p>Object: ${model.object || 'N/A'}</p>
            <p>Limiter: ${model.limiter || 'N/A'}</p>
            <p>Points To: ${model.points_to || 'N/A'}</p>
            <p>Per Input Token: ${model.pricing && model.pricing.per_input_token ? '$' + model.pricing.per_input_token : 'N/A'}</p>
            <p>Per Output Token: ${model.pricing && model.pricing.per_output_token ? '$' + model.pricing.per_output_token : 'N/A'}</p>
        `;
    }

    function generateSkailarContent(model) {
        return `
            <p>Object: ${model.object || 'N/A'}</p>
            <p>Created: ${model.created || 'N/A'}</p>
            <p>Type: ${model.type || 'N/A'}</p>
            <p>Premium: ${model.premium !== undefined ? (model.premium ? 'Yes' : 'No') : 'N/A'}</p>
            <p>Enabled: ${model.enabled !== undefined ? (model.enabled ? 'Yes' : 'No') : 'N/A'}</p>
            <p>Endpoint: ${model.endpoint || 'N/A'}</p>
            <p>Max Tokens: ${model.max_tokens !== undefined ? model.max_tokens : 'N/A'}</p>
        `;
    }

    function generateHelixmindContent(model) {
        return `
            <p>Object: ${model.object || 'N/A'}</p>
            <p>Owned By: ${model.owned_by || 'N/A'}</p>
            <p>Endpoint: ${model.endpoint || 'N/A'}</p>
        `;
    }

    function generateHareproxyContent(model) {
        return `
            <p>Object: ${model.object || 'N/A'}</p>
            <p>Owned By: ${model.owned_by || 'N/A'}</p>
        `;
    }

    function generateMiraaiContent(model) {
        return `
            <p>Object: ${model.object || 'N/A'}</p>
            <p>Type: ${model.type || 'N/A'}</p>
            <p>Multiplier: ${model.multiplier || 'N/A'}</p>
            <p>Owned By: ${model.owned_by || 'N/A'}</p>
        `;
    }

    function generateWebraftaiContent(model) {
        return `
            <p>Object: ${model.object || 'N/A'}</p>
            <p>Endpoint: ${model.endpoint || 'N/A'}</p>
            <p>Premium: ${model.premium !== undefined ? (model.premium ? 'Yes' : 'No') : 'N/A'}</p>
            <p>Free Credits: ${model.free_credits !== undefined ? model.free_credits : 'N/A'}</p>
        `;
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
        modelContainer.innerHTML = '';
    
        const normalizedFilter = filter.toLowerCase().trim();
        const filterWords = normalizedFilter.split(/\s+/);
    
        const filteredModels = modelData.filter(model => {
            const modelString = JSON.stringify(model).toLowerCase();
            return filterWords.every(word => modelString.includes(word));
        });
    
        modelCountElement.textContent = filteredModels.length;
    
        if (filteredModels.length === 0) {
            const noResultsMessage = document.createElement('div');
            noResultsMessage.textContent = 'No models found matching your search.';
            noResultsMessage.className = 'no-results-message';
            modelContainer.appendChild(noResultsMessage);
        } else {
            const fragment = document.createDocumentFragment();
            filteredModels.forEach((model, index) => {
                const modelBox = createModelBox(model, currentProvider);
                fragment.appendChild(modelBox);
            });
            modelContainer.appendChild(fragment);
        }
    
        loadingElement.style.display = 'none';
        adjustLayout();
    }

    function adjustLayout() {
        const containerWidth = modelContainer.offsetWidth;
        const modelBoxes = document.querySelectorAll('.model-box');

        if (containerWidth < 480) {
            modelBoxes.forEach(box => box.style.width = '100%');
        } else {
            modelBoxes.forEach(box => box.style.width = '');
        }
    }

    function preloadAvatars() {
        const avatarUrls = new Set();
        Object.values(ownerInfo).forEach(owner => {
            owner.avatars.forEach(avatar => avatarUrls.add(avatar));
        });
    
        avatarUrls.forEach(url => {
            const img = new Image();
            img.src = url;
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

        setLoadingState(true);
        try {
            const provider = getProviderFromButton(button);
            await updateProviderUI(provider);
        } catch (error) {
            handleError(error);
        } finally {
            setLoadingState(false);
        }
    }

    function shouldIgnoreClick(button) {
        return (
            !button ||
            button.classList.contains('active') ||
            isLoading
        );
    }

    function setLoadingState(isLoadingState) {
        isLoading = isLoadingState;
        loadingElement.style.display = isLoadingState ? 'block' : 'none';
        if (isLoadingState) {
            modelContainer.innerHTML = '';
            modelCountElement.textContent = 'Loading...';
            apiDescription.classList.add('loading');
            apiDescription.textContent = 'Loading...';
        }
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
        renderProviderInfo(owner);

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

    function renderProviderInfo(owner) {
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

    function isCacheValid(cachedData, provider) {
        return (
            cachedData &&
            cachedData[provider] &&
            cachedData[provider] !== 'error'
        );
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

    function handleError(error) {
        console.error('Error loading provider:', error);
        apiDescription.textContent = 'Error loading provider information';
    }

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
            updateRating('rimunace'); // Add this line to set initial rating
        } catch (error) {
            console.error('Error loading models:', error);
            providerInfoBox.innerHTML = 'Error loading provider information';
            apiDescription.textContent = 'Error loading provider information';
        } finally {
            loadingElement.style.display = 'none';
            setButtonsState(false);
            animateInitialTitle();
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

    function setButtonsState(disabled) {
        document.querySelectorAll('.api-button').forEach(button => {
            button.disabled = disabled;
            if (disabled) {
                button.style.opacity = '0.5';
                button.style.cursor = 'not-allowed';
            } else {
                button.style.opacity = '1';
                button.style.cursor = 'pointer';
            }
        });
    }

    function displayError(message) {
        modelContainer.innerHTML = '';
        const errorMessage = document.createElement('div');
        errorMessage.textContent = message;
        errorMessage.className = 'error-message';
        modelContainer.appendChild(errorMessage);
    }

    document.querySelectorAll('.api-button').forEach(button => {
        button.addEventListener('click', async function() {
            const provider = this.dataset.api;
            updateApiDescription(provider);
        });
    });

    updateApiDescription('rimunace');

    // Form handling
    const showFormButton = document.getElementById('showFormButton');
    const formModal = document.getElementById('formModal');
    const closeButton = document.querySelector('.close-button');
    const tabButtons = document.querySelectorAll('.tab-button');
    const forms = document.querySelectorAll('.provider-form');

    // Populate existing providers dropdown
    function populateProvidersDropdown() {
        const updateForm = document.getElementById('updateProviderForm');
        if (!updateForm) return;

        const selectContainer = updateForm.querySelector('.custom-select-container');
        if (!selectContainer) return;

        // Clear any existing content
        selectContainer.innerHTML = '';

        // Create custom select
        const customSelect = document.createElement('div');
        customSelect.className = 'custom-select';

        const selectHeader = document.createElement('div');
        selectHeader.className = 'select-header';
        selectHeader.textContent = 'Select a provider...';

        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'select-options';

        // Create hidden select element for form submission
        const hiddenSelect = document.createElement('select');
        hiddenSelect.name = 'existingProvider';
        hiddenSelect.required = true;
        hiddenSelect.style.display = 'none';
        hiddenSelect.innerHTML = '<option value="">Select a provider...</option>';

        // Get providers from ownerInfo
        const providers = Object.keys(ownerInfo);
        
        providers.forEach(provider => {
            // Add option to hidden select
            const hiddenOption = document.createElement('option');
            hiddenOption.value = provider;
            hiddenOption.textContent = provider;
            hiddenSelect.appendChild(hiddenOption);

            // Create visible option
            const option = document.createElement('div');
            option.className = 'select-option';
            option.textContent = provider.charAt(0).toUpperCase() + provider.slice(1);
            option.dataset.value = provider;
            
            option.addEventListener('click', () => {
                hiddenSelect.value = provider;
                selectHeader.textContent = option.textContent;
                optionsContainer.classList.remove('open');
                selectHeader.classList.remove('open');
                
                optionsContainer.querySelectorAll('.select-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                option.classList.add('selected');
            });
            
            optionsContainer.appendChild(option);
        });

        // Add click handler for the header
        selectHeader.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = optionsContainer.classList.contains('open');
            
            // Close any other open dropdowns first
            document.querySelectorAll('.select-options.open').forEach(dropdown => {
                dropdown.classList.remove('open');
                dropdown.previousElementSibling?.classList.remove('open');
            });

            // Toggle current dropdown
            optionsContainer.classList.toggle('open');
            selectHeader.classList.toggle('open');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            optionsContainer.classList.remove('open');
            selectHeader.classList.remove('open');
        });

        customSelect.appendChild(selectHeader);
        customSelect.appendChild(optionsContainer);
        selectContainer.appendChild(hiddenSelect);
        selectContainer.appendChild(customSelect);
    }

    // Handle form submissions
    async function handleFormSubmission(event) {
        event.preventDefault();
        const form = event.target;
        const submitButton = form.querySelector('.submit-button');
        
        try {
            // Disable submit button
            submitButton.disabled = true;
            submitButton.textContent = 'Submitting...';

            const formData = new FormData(form);
            const searchParams = new URLSearchParams();
            
            // Add form fields to searchParams
            for (const [key, value] of formData.entries()) {
                searchParams.append(key, value.trim());
            }

            const response = await fetch('/api/submit-form', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: searchParams.toString()
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Form submission failed');
            }

            // Show success message
            alert('Form submitted successfully!');
            form.reset();
            document.getElementById('formModal').style.display = 'none';

        } catch (error) {
            console.error('Form submission error:', error);
            alert(`Error submitting form: ${error.message}`);
        } finally {
            // Re-enable submit button
            submitButton.disabled = false;
            submitButton.textContent = 'Submit Request';
        }
    }

    // Add event listeners to forms
    document.querySelectorAll('form[name="add-provider"], form[name="update-provider"]')
        .forEach(form => {
            form.addEventListener('submit', handleFormSubmission);
        });

    // Show/hide modal
    showFormButton.onclick = () => {
        formModal.style.display = 'block';
        // Initialize both dropdowns for the update form if it's active
        if (document.getElementById('updateProviderForm').classList.contains('active')) {
            populateProvidersDropdown();
            populateUpdateTypeDropdown();
        }
    };

    closeButton.onclick = () => {
        formModal.style.display = 'none';
    };

    window.onclick = (event) => {
        if (event.target === formModal) {
            formModal.style.display = 'none';
        }
    };

    // Tab switching
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            forms.forEach(form => form.classList.remove('active'));
            
            button.classList.add('active');
            const formId = button.dataset.tab === 'add' ? 'addProviderForm' : 'updateProviderForm';
            document.getElementById(formId).classList.add('active');
    
            // Call both dropdown initializations when Update Provider form is activated
            if (formId === 'updateProviderForm') {
                populateProvidersDropdown();
                populateUpdateTypeDropdown();
            }
        });
    });

    function populateUpdateTypeDropdown() {
        const updateForm = document.getElementById('updateProviderForm');
        if (!updateForm) return;
    
        const selectContainer = updateForm.querySelector('.update-type-container');
        if (!selectContainer) return;
    
        // Clear any existing content
        selectContainer.innerHTML = '';
    
        // Create custom select
        const customSelect = document.createElement('div');
        customSelect.className = 'custom-select';
    
        const selectHeader = document.createElement('div');
        selectHeader.className = 'select-header';
        selectHeader.textContent = 'Select update type...';
    
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'select-options';
    
        // Create hidden select element for form submission
        const hiddenSelect = document.createElement('select');
        hiddenSelect.name = 'updateType';
        hiddenSelect.required = true;
        hiddenSelect.style.display = 'none';
        hiddenSelect.innerHTML = '<option value="">Select update type...</option>';
    
        // Define update types
        const updateTypes = [
            { value: 'endpoint', label: 'API Endpoint' },
            { value: 'discord', label: 'Discord Server' },
            { value: 'website', label: 'Website' },
            { value: 'github', label: 'GitHub' },
            { value: 'icon', label: 'Provider Icon' },
            { value: 'other', label: 'Other' }
        ];
        
        updateTypes.forEach(type => {
            // Add option to hidden select
            const hiddenOption = document.createElement('option');
            hiddenOption.value = type.value;
            hiddenOption.textContent = type.label;
            hiddenSelect.appendChild(hiddenOption);
    
            // Create visible option
            const option = document.createElement('div');
            option.className = 'select-option';
            option.textContent = type.label;
            option.dataset.value = type.value;
            
            option.addEventListener('click', () => {
                hiddenSelect.value = type.value;
                selectHeader.textContent = type.label;
                optionsContainer.classList.remove('open');
                selectHeader.classList.remove('open');
                
                optionsContainer.querySelectorAll('.select-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                option.classList.add('selected');
            });
            
            optionsContainer.appendChild(option);
        });
    
        // Add click handler for the header
        selectHeader.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = optionsContainer.classList.contains('open');
            
            // Close any other open dropdowns first
            document.querySelectorAll('.select-options.open').forEach(dropdown => {
                dropdown.classList.remove('open');
                dropdown.previousElementSibling?.classList.remove('open');
            });
    
            // Toggle current dropdown
            if (!isOpen) {
                optionsContainer.classList.add('open');
                selectHeader.classList.add('open');
            } else {
                optionsContainer.classList.remove('open');
                selectHeader.classList.remove('open');
            }
        });
    
        customSelect.appendChild(selectHeader);
        customSelect.appendChild(optionsContainer);
        selectContainer.appendChild(hiddenSelect);
        selectContainer.appendChild(customSelect);
    }
});

const providerRatings = {
    rimunace: 'F',
    zanity: 'S+',
    anyai: 'S+',
    cablyai: 'S+',
    fresedgpt: 'S+',
    heckerai: 'S+',
    shardai: 'S+',
    zukijourney: 'S+',
    shadowjourney: 'S+',
    shuttleai: 'S+',
    electronhub: 'S+',
    oxygen: 'S+',
    nagaai: 'S+',
    skailar: 'S+',
    helixmind: 'S+',
    hareproxy: 'S+',
    miraai: 'S+',
    webraftai: 'S+'
};

const providerRatingsComment = {
    rimunace: 'Hes a Weeb',
    zanity: 'Goated Developer',
    anyai: 'Goated Developer',
    cablyai: 'Goated Developer',
    fresedgpt: 'Goated Developer',
    heckerai: 'Goated Developer',
    shardai: 'Goated Developer',
    zukijourney: 'Goated Developer',
    shadowjourney: 'Goated Developer',
    shuttleai: 'Goated Developer',
    electronhub: 'Goated Developer',
    oxygen: 'Goated Developer',
    nagaai: 'Goated Developer',
    skailar: 'Goated Developer',
    helixmind: 'Goated Developer',
    hareproxy: 'Goated Developer',
    miraai: 'Goated Developer',
    webraftai: 'Goated Developer'
}

function updateRating(provider) {
    const ratingElement = document.getElementById('ratingValue');
    const tooltipElement = document.getElementById('ratingTooltip');
    const rating = providerRatings[provider] || 'N/A';
    ratingElement.textContent = rating;
    
    ratingElement.classList.remove('rating-sp', 'rating-s', 'rating-a', 'rating-b', 'rating-c', 'rating-d', 'rating-e', 'rating-f');
    
    const ratingClass = rating.toLowerCase().replace('+', 'p');
    ratingElement.classList.add(`rating-${ratingClass}`);

    // Set tooltip content
    const comment = providerRatingsComment[provider] || 'No comment available';
    tooltipElement.textContent = comment;
}

const ownerInfo = {
    rimunace: {
        description: "Respire & James",
        avatars: ["../assets/avatar/respire.webp", "../assets/avatar/james.webp"],
        links: [
            { url: "https://api.rimunace.xyz", text: "Website", icon: "../assets/icons/web.png", color: "website" },
            { url: "https://discord.gg/respy-tech", text: "Discord", icon: "../assets/icons/discord.png", color: "discord" },
            { url: "https://github.com/rimunace", text: "GitHub", icon: "../assets/icons/github.png", color: "github" }
        ]
    },
    zanity: {
        description: "Voidi & Cookie",
        avatars: ["../assets/avatar/voidi.webp", "../assets/avatar/cookie.webp"],
        links: [
            { url: "https://zanity.xyz/", text: "Website", icon: "../assets/icons/web.png", color: "website" },
            { url: "https://discord.gg/4DRjqaFkhd", text: "Discord", icon: "../assets/icons/discord.png", color: "discord" }
        ]
    },
    anyai: {
        description: "meow_18838",
        avatars: ["../assets/avatar/meow.gif"],
        links: [
            { url: "https://api.airforce/", text: "Website", icon: "../assets/icons/web.png", color: "website" },
            { url: "https://discord.com/invite/q55gsH8z5F ", text: "Discord", icon: "../assets/icons/discord.png", color: "discord" },
            { url: "https://github.com/meow-18838", text: "GitHub", icon: "../assets/icons/github.png", color: "github" }
        ]
    },
    cablyai: {
        description: "meow_18838",
        avatars: ["../assets/avatar/meow.gif"],
        links: [
            { url: "https://cablyai.com/", text: "Website", icon: "../assets/icons/web.png", color: "website" },
            { url: "https://discord.gg/2k4j4PxE", text: "Discord", icon: "../assets/icons/discord.png", color: "discord" },
            { url: "https://github.com/meow-18838", text: "GitHub", icon: "../assets/icons/github.png", color: "github" }
        ]
    },
    fresedgpt: {
        description: "fresed",
        avatars: ["../assets/avatar/fresed.webp"],
        links: [
            { url: "https://fresed-api.gitbook.io/fresed-api", text: "Website", icon: "../assets/icons/web.png", color: "website" },
            { url: "https://discord.gg/QX86yU4G", text: "Discord", icon: "../assets/icons/discord.png", color: "discord" },
            { url: "https://github.com/qazplmqaz", text: "GitHub", icon: "../assets/icons/github.png", color: "github" }
        ]
    },
    heckerai: {
        description: "heckerai.com",
        avatars: ["../assets/avatar/hecker.webp"],
        links: [
            { url: "https://heckerai.com", text: "Website", icon: "../assets/icons/web.png", color: "website" },
            { url: "https://discord.gg/Hg7jw8K8", text: "Discord", icon: "../assets/icons/discord.png", color: "discord" },
            { url: "https://github.com/LiveGamer101", text: "GitHub", icon: "../assets/icons/github.png", color: "github" }
        ]
    },
    shardai: {
        description: ".puzzy. & quartzwarrior",
        avatars: ["../assets/avatar/puzzy.webp", "../assets/avatar/quartz.webp"],
        links: [
            { url: "https://shard-ai.xyz", text: "Website", icon: "../assets/icons/web.png", color: "website" },
            { url: "https://discord.shard-ai.xyz/", text: "Discord", icon: "../assets/icons/discord.png", color: "discord" },
            { url: "https://github.com/Puzzy124", text: "GitHub", icon: "../assets/icons/github.png", color: "github" }
        ]
    },
    zukijourney: {
        description: "ZukiJourney Team",
        avatars: ["../assets/avatar/ZukiJourney.png"],
        links: [
            { url: "https://zukijourney.xyz", text: "Website", icon: "../assets/icons/web.png", color: "website" },
            { url: "https://discord.gg/zukijourney", text: "Discord", icon: "../assets/icons/discord.png", color: "discord" },
            { url: "https://github.com/zukijourney", text: "GitHub", icon: "../assets/icons/github.png", color: "github" }
        ]
    },
    shadowjourney: {
        description: "ichatei",
        avatars: ["../assets/avatar/ichate.webp"],
        links: [
            { url: "https://shadowjourney.xyz", text: "Website", icon: "../assets/icons/web.png", color: "website" },
            { url: "https://discord.com/invite/yB2YZJUA3F", text: "Discord", icon: "../assets/icons/discord.png", color: "discord" },
        ]
    },
    shuttleai: {
        description: "xtristan",
        avatars: ["../assets/avatar/tristan.gif"],
        links: [
            { url: "https://shuttleai.app", text: "Website", icon: "../assets/icons/web.png", color: "website" },
            { url: "https://discord.com/invite/shuttleai", text: "Discord", icon: "../assets/icons/discord.png", color: "discord" },
            { url: "https://github.com/tristandevs", text: "GitHub", icon: "../assets/icons/github.png", color: "github" }
        ]
    },
    electronhub: {
        description: "Soukyo & Kasu",
        avatars: ["../assets/avatar/soukyo.webp", "../assets/avatar/kasu.webp"],
        links: [
            { url: "https://api.electronhub.top", text: "Website", icon: "../assets/icons/web.png", color: "website" },
            { url: "https://discord.gg/apUUqbxCBQ", text: "Discord", icon: "../assets/icons/discord.png", color: "discord" },
            { url: "https://github.com/snowby666", text: "GitHub", icon: "../assets/icons/github.png", color: "github" }
        ]
    },
    oxygen: {
        description: "Tornadosoftware & Thesketchubuser",
        avatars: ["../assets/avatar/tornado.webp", "../assets/avatar/sketchy.webp"],
        links: [
            { url: "https://oxyapi.uk", text: "Website", icon: "../assets/icons/web.png", color: "website" },
            { url: "https://discord.com/invite/kM6MaCqGKA", text: "Discord", icon: "../assets/icons/discord.png", color: "discord" },
            { url: "https://github.com/tornado-softwares", text: "GitHub", icon: "../assets/icons/github.png", color: "github" }
        ]
    },
    nagaai: {
        description: "Zentixua",
        avatars: ["../assets/avatar/zentix.webp"],
        links: [
            { url: "https://naga.ac", text: "Website", icon: "../assets/icons/web.png", color: "website" },
            { url: "https://discord.com/invite/JxRBXBhabu", text: "Discord", icon: "../assets/icons/discord.png", color: "discord" },
            { url: "https://github.com/ZentixUA", text: "GitHub", icon: "../assets/icons/github.png", color: "github" }
        ]
    },
    skailar: {
        description: "Aquadraws",
        avatars: ["../assets/avatar/aqua.webp"],
        links: [
            { url: "https://test.skailar.it/", text: "Website", icon: "../assets/icons/web.png", color: "website" },
            { url: "https://discord.com/invite/ka9tkU9UNz", text: "Discord", icon: "../assets/icons/discord.png", color: "discord" }
        ]
    },
    helixmind: {
        description: "Faer1x",
        avatars: ["../assets/avatar/phantasifae.gif"],
        links: [
            { url: "https://helixmind.online", text: "Website", icon: "../assets/icons/web.png", color: "website" },
            { url: "https://discord.gg/n7RpEtH8J8", text: "Discord", icon: "../assets/icons/discord.png", color: "discord" }
        ]
    },
    hareproxy: {
        description: "yongdong",
        avatars: ["../assets/avatar/yongdung.webp"],
        links: [
            { url: "https://api.hareproxy.io.vn/", text: "Website", icon: "../assets/icons/web.png", color: "website"},
            { url: "https://discord.com/invite/7TAXPFvUzf", text: "Discord", icon: "../assets/icons/discord.png", color: "discord" },
            { url: "https://github.com/sm1945", text: "GitHub", icon: "../assets/icons/github.png", color: "github" }
        ]
    },
    miraai: {
        description: "Vneq, GG, invalidsian, & Soukyo",
        avatars: ["../assets/avatar/vneq.webp", "../assets/avatar/gg.webp", "../assets/avatar/sian.webp", "../assets/avatar/soukyo.webp"],
        links: [
            { url: "https://tryastra.pro/", text: "Website", icon: "../assets/icons/web.png", color: "website" },
            { url: "https://discord.gg/YmVuVXas", text: "Discord", icon: "../assets/icons/discord.png", color: "discord" },
            { url: "https://github.com/vneqisntreal", text: "GitHub", icon: "../assets/icons/github.png", color: "github" }
        ]
    },
    webraftai: {
        description: "DS_GAMER",
        avatars: ["../assets/avatar/dsgamer.webp"],
        links: [
            { url: "https://api3.webraft.in/", text: "Website", icon: "../assets/icons/web.png", color: "website" },
            { url: "https://discord.com/invite/ncaagQjhQ8", text: "Discord", icon: "../assets/icons/discord.png", color: "discord" },
            { url: "https://github.com/ds-gamer", text: "GitHub", icon: "../assets/icons/github.png", color: "github" }
        ]
    }
};

function updateApiDescription(provider) {
    const apiDescription = document.getElementById('apiDescription');
    if (apiDescription) {
        apiDescription.textContent = apiDescriptions[provider] || 'No description available';
    }
}

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
