document.addEventListener('DOMContentLoaded', function() {
    let modelData = [];
    let currentProvider = 'fresedgpt';

    const apiEndpoints = {
        fresedgpt: 'https://fresedgpt.space/v1/models',
        convoai: 'https://api.convoai.tech/v1/models',
        shardai: 'https://shard-ai.xyz/v1/models',
        zukijourney: 'https://zukijourney.xyzbot.net/v1/models',
        shadowjourney: 'https://shadowjourney.xyz/v1/models',
        shuttleai: 'https://api.shuttleai.app/v1/models',
        electronhub: 'https://api.electronhub.top/v1/models',
        oxygen: 'https://app.oxyapi.uk/v1/models'
    };

    const apiDescriptions = {
        fresedgpt: "Docs: https://fresed-api.gitbook.io/fresed-api",
        convoai: "Website: https://convoai.tech/",
        shardai: "Website: https://shard-ai.xyz/",
        zukijourney: "Discord: https://discord.gg/zukijourney",
        shadowjourney: "Website: https://shadowjourney.xyz/",
        shuttleai: 'Website: https://shuttleai.app',
        electronhub: 'Discord: https://discord.com/invite/k73Uw36p',
        oxygen: 'Website: https://www.oxyapi.uk/'
    };

    async function fetchModels(apiProvider) {
        try {
            const response = await fetch(apiEndpoints[apiProvider]);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error('Error fetching models:', error);
            return [];
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

    function createModelDetailsElement(model, apiProvider) {
        const modelDetailsElement = document.createElement('div');
        modelDetailsElement.className = 'model-details';

        const contentGenerator = getContentGenerator(apiProvider);
        const content = contentGenerator(model);

        modelDetailsElement.innerHTML = content;
        return modelDetailsElement;
    }

    function getContentGenerator(apiProvider) {
        const contentGenerators = {
            fresedgpt: (model) => `
                <p>Owner: ${model.owned_by}</p>
                <p>Token Coefficient: ${model.token_coefficient}</p>
                <p>Max Tokens: ${model.max_tokens || 'N/A'}</p>
            `,
            convoai: (model) => `
                <p>Name: ${model.name}</p>
                <p>Max Context: ${model.knowledge.max_context}</p>
                <p>Input Cost: ${model.cost.input_tokens}/1k tokens</p>
                <p>Output Cost: ${model.cost.output_tokens}/1k tokens</p>
                <p>Scope: ${model.scope}</p>
                <p>Membership: ${model.membership.join(', ')}</p>
            `,
            shardai: (model) => `
                <p>Owner: ${model.owned_by}</p>
                <p>Type: ${model.type}</p>
                <p>Cost: ${model.cost}/1k tokens</p>
                <p>Access: ${Object.entries(model.access).filter(([k, v]) => v).map(([k]) => k).join(', ')}</p>
            `,
            zukijourney: (model) => `
                <p>Owner: ${model.owned_by}</p>
                <p>Type: ${model.type}</p>
                <p>Supports Vision: ${model.supports_vision ? 'Yes' : 'No'}</p>
                <p>Is Free: ${model.is_free ? 'Yes' : 'No'}</p>
            `,
            shadowjourney: (model) => {
                const cost = model.cost === "free" ? "False" : model.cost === "premium" ? "True" : "False";
                return `
                    <p>Owned By: ${model.owned_by}</p>
                    <p>Object: ${model.object}</p>
                    <p>Premium: ${cost}</p>
                `;
            },
            shuttleai: (model) => `
                <p>Cost: ${model.cost ? model.cost : "N/A"}/req</p>
                <p>Model: ${model.object}</p>
                <p>Premium: ${model.premium ? model.premium : "N/A"}</p>
                <p>Owned: ${model.owned_by ? model.owned_by : "N/A"}</p>
            `,
            electronhub: (model) => `
                <p>Object: ${model.object ? model.object : "N/A"}</p>
                <p>Owned By: ${model.owned_by ? model.owned_by : "N/A"}</p>
                <p>Max Tokens: ${model.tokens ? model.tokens : "N/A"}</p>
                <p>Cost: ${model.cost ? model.cost : "N/A"}</p>
            `,
            oxygen: (model) => `
                <p>Name: ${model.name ? model.name : "N/A"}</p>
                <p>Owned By: ${model.owned_by ? model.owned_by : "N/A"}</p>
                <p>Type: ${model.type ? model.type : "N/A"}</p>
                <p>Multi-Gen: ${model.multiple_generations ? model.multiple_generations : "N/A"}</p>
            `
        };

        return contentGenerators[apiProvider] || (() => '');
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
        modelContainer.innerHTML = ''; // Clear previous content
        
        const normalizedFilter = filter.toLowerCase().trim();
        const filterWords = normalizedFilter.split(/\s+/);
        
        const filteredModels = modelData.filter(model => {
            const modelString = JSON.stringify(model).toLowerCase();
            return filterWords.every(word => modelString.includes(word));
        });
        
        filteredModels.forEach((model, index) => {
            const modelBox = createModelBox(model, currentProvider);
            modelBox.style.animationDelay = `${index * 0.1}s`;
            modelContainer.appendChild(modelBox);
        });
    
        // Display a message if no models are found
        if (filteredModels.length === 0) {
            const noResultsMessage = document.createElement('div');
            noResultsMessage.textContent = 'No models found matching your search.';
            noResultsMessage.className = 'no-results-message';
            modelContainer.appendChild(noResultsMessage);
        }
    }

    document.getElementById('searchInput').addEventListener('input', (e) => {
        displayModels(e.target.value);
    });

    document.querySelectorAll('.api-button').forEach(button => {
        button.addEventListener('click', async (e) => {
            document.querySelectorAll('.api-button').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            currentProvider = e.target.dataset.api;
            document.getElementById('apiDescription').textContent = apiDescriptions[currentProvider];
            document.getElementById('loading').style.display = 'block';
            document.getElementById('modelContainer').innerHTML = '';
            modelData = await fetchModels(currentProvider);
            document.getElementById('loading').style.display = 'none';
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
        modelData = await fetchModels('fresedgpt');
        document.getElementById('loading').style.display = 'none';
        displayModels();
        animateInitialTitle(); // Start with the initial title animation
    })();
});
