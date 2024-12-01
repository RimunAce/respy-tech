import { providerRatings, providerRatingsComment } from './providerInfo.js';
import { apiDescriptions } from './providerConfig.js';

export function setLoadingState(isLoading, elements) {
    const { modelContainer, modelCountElement, loadingElement, apiDescription } = elements;
    loadingElement.style.display = isLoading ? 'block' : 'none';
    if (isLoading) {
        modelContainer.innerHTML = '';
        modelCountElement.textContent = 'Loading...';
        apiDescription.classList.add('loading');
        apiDescription.textContent = 'Loading...';
    }
}

export function setButtonsState(disabled) {
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

export function updateRating(provider) {
    const ratingElement = document.getElementById('ratingValue');
    const tooltipElement = document.getElementById('ratingTooltip');
    const rating = providerRatings[provider] || 'N/A';
    ratingElement.textContent = rating;
    
    ratingElement.classList.remove('rating-sp', 'rating-s', 'rating-a', 'rating-b', 'rating-c', 'rating-d', 'rating-e', 'rating-f');
    
    const ratingClass = rating.toLowerCase().replace('+', 'p');
    ratingElement.classList.add(`rating-${ratingClass}`);

    const comment = providerRatingsComment[provider] || 'No comment available';
    tooltipElement.textContent = comment;
}

export function updateApiDescription(provider) {
    const apiDescription = document.getElementById('apiDescription');
    if (apiDescription) {
        apiDescription.textContent = apiDescriptions[provider] || 'No description available';
    }
}

export function displayError(message, modelContainer) {
    modelContainer.innerHTML = '';
    const errorMessage = document.createElement('div');
    errorMessage.textContent = message;
    errorMessage.className = 'error-message';
    modelContainer.appendChild(errorMessage);
}

export function displayWarning(errorMessages, modelContainer) {
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

export function renderProviderInfo(owner, providerInfoBox) {
    if (!providerInfoBox) return;
    
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

export function adjustLayout(modelContainer) {
    if (!modelContainer) return;
    
    const isMobile = window.innerWidth <= 768;
    const modelBoxes = modelContainer.querySelectorAll('.model-box');
    
    modelBoxes.forEach(box => {
        // Ensure proper sizing on mobile
        if (isMobile) {
            box.style.width = '100%';
            box.style.maxWidth = 'none';
        } else {
            box.style.width = '';
            box.style.maxWidth = '';
        }
        
        // Ensure visibility
        box.style.display = 'flex';
        box.style.opacity = '1';
    });
}