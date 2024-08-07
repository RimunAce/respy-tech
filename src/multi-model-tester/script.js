// API configuration
const API_URL = 'https://api.electronhub.top';

// DOM elements
const submitButton = document.getElementById('submitBtn');
const userInputField = document.getElementById('userInput');
const loadingIndicatorElement = document.getElementById('loadingIndicator');
const resultsContainer = document.getElementById('results');
const modelSearchInput = document.getElementById('modelSearch');
const modelDropdown = document.getElementById('modelDropdown');
const selectedModelsCount = document.getElementById('selectedModelsCount');

// Constants
const MAX_CONCURRENT_REQUESTS = 10; // Reduced from 60
const REQUEST_TIMEOUT = 30000; // Increased from 20000 to 30000 (30 seconds)

// Model icons mapping
const MODEL_ICONS = {
    'OpenAI': 'https://static-00.iconduck.com/assets.00/openai-icon-2021x2048-4rpe5x7n.png',
    'Anthropic': 'https://seeklogo.com/images/A/anthropic-icon-logo-630D0BB290-seeklogo.com.png',
    'Google': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/480px-Google_%22G%22_logo.svg.png',
    'Meta': 'https://miro.medium.com/v2/resize:fit:2400/1*9IKlJavI2QSn7CpKVee5uA.png',
    'Mistral': 'https://vectorseek.com/wp-content/uploads/2023/12/Mistral-AI-Icon-Logo-Vector.svg-.png',
    '01.ai': 'https://image.pitchbook.com/L2bK5VFCVlRTs9U885h26RgLeeK1699302271340_200x200',
    'alibaba': 'https://cdn4.iconfinder.com/data/icons/flat-brand-logo-2/512/alibaba-512.png'
};

// Model owner mapping
const MODEL_OWNERS = {
    'gpt': 'OpenAI',
    'claude': 'Anthropic',
    'gemini': 'Google',
    'gemma': 'Google',
    'palm': 'Google',
    'llama': 'Meta',
    'mistral': 'Mistral',
    'mixtral': 'Mistral',
    'dolphin': 'Mistral',
    'yi': '01.ai',
    'qwen': 'alibaba'
};

let allModels = [];
let selectedModels = [];

/**
 * Determines the model owner based on the model ID.
 * @param {string} modelId - The ID of the model.
 * @returns {string} The owner of the model or 'Unknown' if not found.
 */
function getModelOwner(modelId) {
    const lowerModelId = modelId.toLowerCase();
    const owner = Object.keys(MODEL_OWNERS).find(key => lowerModelId.includes(key));
    return owner ? MODEL_OWNERS[owner] : 'Unknown';
}

/**
 * Fetches and filters available models.
 * @returns {Promise<Array>} A promise that resolves to an array of filtered models.
 */
async function fetchModels() {
    try {
        const response = await axios.get(`${API_URL}/models`);
        allModels = response.data.data.filter(model => 
            model.endpoints.includes('/v1/chat/completions') &&
            ['openai', 'anthropic', 'google', 'meta', 'mistralai', '01.ai', 'alibaba'].includes(model.owned_by)
        );
        populateModelDropdown();
    } catch (error) {
        console.error('Error fetching models:', error);
        throw new Error('Failed to fetch models. Please try again later.');
    }
}

/**
 * Populates the model dropdown with available models.
 */
function populateModelDropdown(modelsToDisplay = allModels) {
    modelDropdown.innerHTML = '';
    modelsToDisplay.forEach(model => {
        const option = document.createElement('div');
        option.className = 'p-2 hover:bg-gray-700 cursor-pointer flex items-center select-none transition-all duration-300 ease-in-out';
        const modelOwner = getModelOwner(model.id);
        option.innerHTML = `
            <input type="checkbox" id="${model.id}" class="mr-2" ${selectedModels.includes(model.id) ? 'checked' : ''}>
            <label for="${model.id}" class="flex-grow cursor-pointer">
                ${model.id} <span class="text-blue-300 text-sm">(${modelOwner})</span>
            </label>
        `;
        option.addEventListener('click', (event) => {
            event.stopPropagation();
            toggleModel(model.id);
        });
        modelDropdown.appendChild(option);
    });
}

/**
 * Toggles the selection of a model.
 * @param {string} modelId - The ID of the model to toggle.
 */
function toggleModel(modelId) {
    const index = selectedModels.indexOf(modelId);
    if (index > -1) {
        selectedModels.splice(index, 1);
    } else if (selectedModels.length < 9) {
        selectedModels.push(modelId);
    }
    updateSelectedModelsCount();
    const filteredModels = allModels.filter(model => model.id.toLowerCase().includes(currentSearchTerm));
    populateModelDropdown(filteredModels);
}

/**
 * Updates the count of selected models.
 */
function updateSelectedModelsCount() {
    selectedModelsCount.textContent = `${selectedModels.length}/9 models selected`;
}

/**
 * Sends a single request to the model API.
 * @param {Object} model - The model object.
 * @param {string} userInputText - The user's input text.
 * @returns {Promise<Object>} A promise that resolves to the API response.
 */
async function makeApiRequest(model, userInputText) {
    const response = await fetch('/.netlify/functions/multiLLM', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: model.id,
            messages: [{ role: 'user', content: userInputText }]
        })
    });

    if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
    }

    const data = await response.json();
    if (!data.choices?.[0]?.message) {
        throw new Error('Invalid response structure');
    }

    return data;
}

/**
 * Sends a request to a specific model with exponential backoff.
 * @param {Object} model - The model object.
 * @param {string} userInputText - The user's input text.
 * @returns {Promise<Object>} A promise that resolves to the model's response.
 */
async function sendRequest(model, userInputText) {
    const maxRetries = 3;
    const startTime = performance.now();

    for (let retryCount = 0; retryCount < maxRetries; retryCount++) {
        try {
            const data = await makeApiRequest(model, userInputText);
            const timeTaken = (performance.now() - startTime) / 1000;
            return {
                name: model.id,
                content: data.choices[0].message.content,
                timeTaken: timeTaken
            };
        } catch (error) {
            console.error(`Error with model ${model.id}:`, error);
            if (retryCount === maxRetries - 1) {
                return {
                    name: model.id,
                    content: `ERROR: ${error.message}. Please try again later.`,
                    timeTaken: null
                };
            }
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
        }
    }
}

/**
 * Determines the CSS class for the time indicator based on response time.
 * @param {number|null} timeTaken - The time taken for the response.
 * @returns {string} The CSS class for the time indicator.
 */
function getTimeIndicatorClass(timeTaken) {
    if (timeTaken === null) return 'bg-orange-500 pulse';
    if (timeTaken < 5) return 'bg-green-500';
    if (timeTaken < 10) return 'bg-yellow-500';
    return 'bg-red-500';
}

/**
 * Displays the results of all model responses.
 * @param {Array<Object>} responses - An array of model responses.
 */
function displayResults(responses) {
    resultsContainer.innerHTML = '';
    let row;
    responses.forEach((response, index) => {
        if (index % 3 === 0) {
            row = document.createElement('div');
            row.className = 'flex justify-between mb-8';
            resultsContainer.appendChild(row);
        }
        const resultElement = document.createElement('div');
resultElement.className = 'bg-gray-800 p-6 rounded-lg neo-glow result-box w-[32%]';
        
        const timeIndicatorClass = getTimeIndicatorClass(response.timeTaken);
        const timeIndicator = response.timeTaken !== null
            ? `<span class="${timeIndicatorClass} px-2 py-1 rounded text-xs font-bold">${response.timeTaken.toFixed(2)}s</span>`
            : '<span class="bg-orange-500 pulse px-2 py-1 rounded text-xs font-bold">⚠️ Failed</span>';

        const modelOwner = getModelOwner(response.name);
        const iconUrl = MODEL_ICONS[modelOwner] || '';

        resultElement.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <div class="flex items-center">
                    <img src="${iconUrl}" alt="${modelOwner} icon" class="model-icon mr-2">
                    <h3 class="text-xl font-bold text-blue-300">${response.name}</h3>
                </div>
                ${timeIndicator}
            </div>
            <p class="${response.content.startsWith('ERROR:') ? 'text-red-400' : 'text-blue-100'}">${response.content}</p>
        `;
        row.appendChild(resultElement);
    });
}

/**
 * Processes model requests in batches.
 * @param {string} userInputText - The user's input text.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of model responses.
 */
async function processModelRequests(userInputText) {
    const allResponses = [];
    const totalModels = selectedModels.length;
    let completedModels = 0;

    const updateProgress = (progress) => {
        const progressText = document.getElementById('progressText');
        progressText.textContent = `Processing... [${progress}%]`;
    };

    for (let i = 0; i < selectedModels.length; i += MAX_CONCURRENT_REQUESTS) {
        updateProgress(0);
        const batch = selectedModels.slice(i, i + MAX_CONCURRENT_REQUESTS);
        const batchPromises = batch.map(modelId => 
            sendRequest(allModels.find(m => m.id === modelId), userInputText)
                .then(response => {
                    completedModels++;
                    const progress = Math.round((completedModels / totalModels) * 100);
                    updateProgress(progress);
                    return response;
                })
        );
        const batchResponses = await Promise.all(batchPromises);
        allResponses.push(...batchResponses);
    }

    // Show 100% completion
    updateProgress(100);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for a second

    return allResponses;
}

let currentSearchTerm = '';

// Event listeners
modelSearchInput.addEventListener('input', () => {
    currentSearchTerm = modelSearchInput.value.toLowerCase();
    const filteredModels = allModels.filter(model => model.id.toLowerCase().includes(currentSearchTerm));
    populateModelDropdown(filteredModels);
    modelDropdown.classList.remove('hidden');
    modelDropdown.classList.add('dropdown-open');
});

modelSearchInput.addEventListener('focus', () => {
    modelDropdown.classList.remove('hidden');
    modelDropdown.classList.add('dropdown-open');
});

document.addEventListener('click', (event) => {
    if (!modelSearchInput.contains(event.target) && !modelDropdown.contains(event.target)) {
        modelDropdown.classList.add('hidden');
        modelDropdown.classList.remove('dropdown-open');
    }
});

modelDropdown.addEventListener('click', (event) => {
    event.stopPropagation();
});

function disableSubmitButton() {
    submitButton.disabled = true;
    submitButton.classList.add('opacity-50', 'cursor-not-allowed');
    submitButton.textContent = 'Processing...';
}

function enableSubmitButton() {
    submitButton.disabled = false;
    submitButton.classList.remove('opacity-50', 'cursor-not-allowed');
    submitButton.textContent = 'Submit';
}

submitButton.addEventListener('click', async () => {
    const userInputText = userInputField.value.trim();
    if (!userInputText) {
        alert('Please enter a message.');
        return;
    }
    if (selectedModels.length === 0) {
        alert('Please select at least one model.');
        return;
    }

    disableSubmitButton();
    loadingIndicatorElement.classList.remove('hidden');
    loadingIndicatorElement.style.opacity = '0';
    resultsContainer.innerHTML = '';

    // Fade in the loading indicator
    setTimeout(() => {
        loadingIndicatorElement.style.transition = 'opacity 0.5s';
        loadingIndicatorElement.style.opacity = '1';
    }, 0);

    try {
        const responses = await processModelRequests(userInputText);

        // Fade out the loading indicator
        loadingIndicatorElement.style.opacity = '0';
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait for fade out

        loadingIndicatorElement.classList.add('hidden');

        // Fade in the results
        resultsContainer.style.opacity = '0';
        displayResults(responses);
        setTimeout(() => {
            resultsContainer.style.transition = 'opacity 0.5s';
            resultsContainer.style.opacity = '1';
        }, 0);
    } catch (error) {
        console.error('Error processing requests:', error);
        alert(error.message || 'An error occurred while processing your request. Please try again later.');
    } finally {
        loadingIndicatorElement.classList.add('hidden');
        enableSubmitButton();
    }
});

// Initialize
fetchModels();