const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCachedData = (key) => {
    const cachedItem = cache.get(key);
    if (cachedItem && Date.now() - cachedItem.timestamp < CACHE_DURATION) {
        return cachedItem.data;
    }
    return null;
};

const setCachedData = (key, data) => {
    cache.set(key, { data, timestamp: Date.now() });
};

document.addEventListener('DOMContentLoaded', function () {
    let modelData = [];
    let currentProvider = 'rimunace';

    const apiEndpoints = {
        rimunace: 'https://api.rimunace.xyz/v1/models',
        zanity: 'https://api.zanity.net/v1/models',
        anyai: 'http://api.llmplayground.net/v1/models',
        cablyai: 'https://cablyai.com/v1/models',
        fresedgpt: 'https://fresedgpt.space/v1/models',
        heckerai: 'https://heckerai.com/v1/models',
        convoai: 'https://api.convoai.tech/v1/models',
        shardai: 'https://api.shard-ai.xyz/v1/models',
        zukijourney: 'https://zukijourney.xyzbot.net/v1/models',
        shadowjourney: 'https://shadowjourney.xyz/v1/models',
        shuttleai: 'https://api.shuttleai.app/v1/models',
        electronhub: 'https://api.electronhub.top/v1/models',
        oxygen: 'https://app.oxyapi.uk/v1/models'
    };

    const apiDescriptions = {
        rimunace: 'Website: https://rimunace.xyz (This API is maintained by Creator of Respy.Tech)',
        zanity: 'Website: https://api.zanity.net/',
        anyai: "Discord: https://discord.com/invite/q55gsH8z5F (This API doesn't require an API key for FREE tier)",
        cablyai: "Website: https://cablyai.com/",
        fresedgpt: "Docs: https://fresed-api.gitbook.io/fresed-api",
        heckerai: "Discord: https://discord.gg/rmKrSWwz",
        convoai: "Website: https://convoai.tech/",
        shardai: "Website: https://shard-ai.xyz/",
        zukijourney: "Discord: https://discord.gg/zukijourney",
        shadowjourney: "Website: https://shadowjourney.xyz/",
        shuttleai: 'Website: https://shuttleai.app',
        electronhub: 'Discord: https://discord.com/invite/k73Uw36p',
        oxygen: 'Website: https://www.oxyapi.uk/'
    };

    const fetchModels = async (apiProvider) => {
        try {
            const response = await fetch(apiEndpoints[apiProvider]);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error(`Error fetching models for ${apiProvider}:`, error);
            return [];
        }
    };

    const fetchAllModels = async () => {
        const providers = Object.keys(apiEndpoints);
        const modelPromises = providers.map(provider => fetchModels(provider));
        const results = await Promise.allSettled(modelPromises);
        
        const allModels = {};
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                allModels[providers[index]] = result.value;
            } else {
                console.error(`Failed to fetch models for ${providers[index]}:`, result.reason);
                allModels[providers[index]] = [];
            }
        });
        
        return allModels;
    };

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

    function createModelDetailsElement(model, apiProvider) {
        const modelDetailsElement = document.createElement('div');
        modelDetailsElement.className = 'model-details';

        const contentGenerator = getContentGenerator(apiProvider);
        const content = contentGenerator(model);

        modelDetailsElement.innerHTML = content;
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
        convoai: generateConvoaiContent,
        shardai: generateShardaiContent,
        zukijourney: generateZukijourneyContent,
        shadowjourney: generateShadowjourneyContent,
        shuttleai: generateShuttleaiContent,
        electronhub: generateElectronhubContent,
        oxygen: generateOxygenContent
    };

    function generateRimunaceContent(model) {
        return `
            <p>Premium: ${model.metadata.premium ? 'Yes' : 'No'}</p>
            <p>Max Tokens: ${model.metadata.max_tokens}</p>
            <p>Function Calling: ${model.metadata.function_call ? 'Yes' : 'No'}</p>
            <p>Owner: ${model.owned_by}</p>
            <p>Object: ${model.object}</p>
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
            <p>AI API By: ${model["AI API by"]}
        `;
    }

    function generateConvoaiContent(model) {
        return `
            <p>Name: ${model.name}</p>
            <p>Max Context: ${model.knowledge.max_context}</p>
            <p>Input Cost: ${model.cost.input_tokens}/1k tokens</p>
            <p>Output Cost: ${model.cost.output_tokens}/1k tokens</p>
            <p>Scope: ${model.scope}</p>
            <p>Membership: ${model.membership.join(', ')}</p>
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
            <p>Cost: ${model.cost ? model.cost : "N/A"}</p>
        `;
    }

    function generateOxygenContent(model) {
        return `
            <p>Name: ${model.name ? model.name : "N/A"}</p>
            <p>Owned By: ${model.owned_by ? model.owned_by : "N/A"}</p>
            <p>Type: ${model.type ? model.type : "N/A"}</p>
            <p>Multi-Gen: ${model.multiple_generations ? model.multiple_generations : "N/A"}</p>
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
        const modelContainer = document.getElementById('modelContainer');
        const modelCountElement = document.getElementById('modelCount');
        const loadingElement = document.getElementById('loading');
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
            const observer = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const modelBox = entry.target;
                        const model = JSON.parse(modelBox.dataset.model);
                        modelBox.appendChild(createModelIdElement(model));
                        modelBox.appendChild(createModelDetailsElement(model, currentProvider));
                        modelBox.appendChild(createCopyButton(model));
                        observer.unobserve(modelBox);
                    }
                });
            }, { rootMargin: "100px" });
    
            filteredModels.forEach((model, index) => {
                const modelBox = document.createElement('div');
                modelBox.className = 'model-box';
                modelBox.dataset.model = JSON.stringify(model);
                modelBox.style.animationDelay = `${index * 0.05}s`;
                modelContainer.appendChild(modelBox);
                observer.observe(modelBox);
            });
        }
    
        loadingElement.style.display = 'none';
        adjustLayout();
    }
    
    // Add this new function to handle layout adjustments
    function adjustLayout() {
        const modelContainer = document.getElementById('modelContainer');
        const containerWidth = modelContainer.offsetWidth;
        const modelBoxes = document.querySelectorAll('.model-box');
        
        if (containerWidth < 480) {
            modelBoxes.forEach(box => box.style.width = '100%');
        } else {
            modelBoxes.forEach(box => box.style.width = '');
        }
    }
    
    // Add event listener for window resize
    window.addEventListener('resize', adjustLayout);

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
    
    document.getElementById('searchInput').addEventListener('input', (e) => {
        debouncedDisplayModels(e.target.value);
    });

    document.querySelectorAll('.api-button').forEach(button => {
        button.addEventListener('click', async (e) => {
            document.querySelectorAll('.api-button').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            currentProvider = e.target.dataset.api;
            document.getElementById('apiDescription').textContent = apiDescriptions[currentProvider];
            const loadingElement = document.getElementById('loading');
            loadingElement.style.display = 'block';
            document.getElementById('modelContainer').innerHTML = '';
            document.getElementById('modelCount').textContent = 'Loading...';
    
            const cachedAllModels = getCachedData('allModels');
            if (cachedAllModels) {
                modelData = cachedAllModels[currentProvider];
            } else {
                const allModels = await fetchAllModels();
                setCachedData('allModels', allModels);
                modelData = allModels[currentProvider];
            }
            displayModels();
        });
    });

    // Dynamic title animation
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
                setTimeout(animateTitle, 1500); // Wait for 1.5 seconds before changing again
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
                setTimeout(animateTitle, 1500); // Start the regular animation after 1.5 seconds
            }
        }, 50);
    }

    // Scroll to top functionality
    const scrollToTopButton = document.getElementById("scrollToTop");

    window.onscroll = function() {
        const shouldShowButton = document.body.scrollTop > 20 || document.documentElement.scrollTop > 20;
        
        if (shouldShowButton && scrollToTopButton.style.display !== "block") {
            scrollToTopButton.style.display = "block";
            scrollToTopButton.style.animation = 'fadeIn 0.3s ease';
        } else if (!shouldShowButton && scrollToTopButton.style.display === "block") {
            scrollToTopButton.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                scrollToTopButton.style.display = 'none';
            }, 300);
        }
    };

    scrollToTopButton.addEventListener("click", function() {
        window.scrollTo({
            top: 0,
            behavior: 'instant' // This makes the scroll instant
        });
        scrollToTopButton.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            scrollToTopButton.style.display = 'none';
        }, 300);
    });

    // Initial fetch and display of models
    (async () => {
        const loadingElement = document.getElementById('loading');
        loadingElement.style.display = 'block';
        
        const providers = Object.keys(apiEndpoints);
        const loadProviders = async (index) => {
            if (index < providers.length) {
                const provider = providers[index];
                const models = await fetchModels(provider);
                const allModels = getCachedData('allModels') || {};
                allModels[provider] = models;
                setCachedData('allModels', allModels);
                
                if (provider === currentProvider) {
                    modelData = models;
                    displayModels();
                }
                
                loadProviders(index + 1);
            } else {
                loadingElement.style.display = 'none';
            }
        };
        
        loadProviders(0);
        animateInitialTitle();
    })();
});
