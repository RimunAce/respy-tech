export function generateRimunaceContent(model) {
    const accessTiers = Object.entries(model.access)
        .filter(([_, v]) => v)
        .map(([k]) => k.charAt(0).toUpperCase() + k.slice(1))
        .join(', ');

    return `
        <p>Type: ${model.type}</p>
        <p>Owner: ${model.owned_by}</p>
        <p>Cost: ${model.cost} / request</p>
        ${accessTiers ? `<p>Access: ${accessTiers}</p>` : ''}
    `;
}

export function generateZanityContent(model) {
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

export function generateAnyaiContent(model) {
    return `
        <p>Open Source: ${model.created === 0 ? 'Yes' : 'No'}</p>
        <p>Owner: ${model.owned_by}</p>
        <p>Object: ${model.object}</p>
    `;
}

export function generateCablyaiContent(model) {
    return `
        <p>Owner: ${model.owned_by}</p>
        <p>Type: ${model.type}</p>
        <p>Vision Supported: ${model.support_vision ? 'Yes' : 'No'}</p>
    `;
}

export function generateFresedgptContent(model) {
    return `
        <p>Owner: ${model.owned_by}</p>
        <p>Token Coefficient: ${model.token_coefficient}</p>
        <p>Max Tokens: ${model.max_tokens || 'N/A'}</p>
    `;
}

export function generateHeckerContent(model) {
    return `
        <p>Owner: ${model.owned_by}</p>
        <p>AI API By: ${model["AI API by"]}</p>
    `;
}


export function generateZukijourneyContent(model) {
    return `
        <p>Owner: ${model.owned_by}</p>
        <p>Type: ${model.type}</p>
        <p>Supports Vision: ${model.supports_vision ? 'Yes' : 'No'}</p>
        <p>Is Free: ${model.is_free ? 'Yes' : 'No'}</p>
    `;
}

export function generateShadowjourneyContent(model) {
    const cost = model.cost === "free" ? "False" : model.cost === "premium" ? "True" : "False";
    return `
        <p>Owned By: ${model.owned_by}</p>
        <p>Object: ${model.object}</p>
        <p>Premium: ${cost}</p>
    `;
}

export function generateShuttleaiContent(model) {
    return `
        <p>Cost: ${model.cost ? model.cost : "N/A"}/req</p>
        <p>Model: ${model.object}</p>
        <p>Premium: ${model.premium ? model.premium : "N/A"}</p>
        <p>Owned: ${model.owned_by ? model.owned_by : "N/A"}</p>
    `;
}

export function generateElectronhubContent(model) {
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

export function generateOxygenContent(model) {
    return `
        <p>Name: ${model.name ? model.name : "N/A"}</p>
        <p>Owned By: ${model.owned_by ? model.owned_by : "N/A"}</p>
        <p>Type: ${model.type ? model.type : "N/A"}</p>
    `;
}

export function generateNagaaiContent(model) {
    return `
        <p>Object: ${model.object || 'N/A'}</p>
        <p>Limiter: ${model.limiter || 'N/A'}</p>
        <p>Points To: ${model.points_to || 'N/A'}</p>
        <p>Per Input Token: ${model.pricing && model.pricing.per_input_token ? '$' + model.pricing.per_input_token : 'N/A'}</p>
        <p>Per Output Token: ${model.pricing && model.pricing.per_output_token ? '$' + model.pricing.per_output_token : 'N/A'}</p>
    `;
}

export function generateSkailarContent(model) {
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

export function generateHelixmindContent(model) {
    return `
        <p>Object: ${model.object || 'N/A'}</p>
        <p>Owned By: ${model.owned_by || 'N/A'}</p>
        <p>Endpoint: ${model.endpoint || 'N/A'}</p>
    `;
}

export function generateHareproxyContent(model) {
    return `
        <p>Object: ${model.object || 'N/A'}</p>
        <p>Owned By: ${model.owned_by || 'N/A'}</p>
    `;
}

export function generateWebraftaiContent(model) {
    return `
        <p>Object: ${model.object || 'N/A'}</p>
        <p>Endpoint: ${model.endpoint || 'N/A'}</p>
        <p>Premium: ${model.premium !== undefined ? (model.premium ? 'Yes' : 'No') : 'N/A'}</p>
        <p>Free Credits: ${model.free_credits !== undefined ? model.free_credits : 'N/A'}</p>
    `;
}

export function generateNobrandaiContent(model) {
    return `
        <p>Object: ${model.object || 'N/A'}</p>
        <p>Cost: ${model.cost || 'N/A'}</p>
        <p>Provider: ${model.provider || 'N/A'}</p>
        <p>Created: ${model.created || 'N/A'}</p>
    `;
}

export function generateVoidAiContent(model) {
    return `
        <p>Object: ${model.object || 'N/A'}</p>
        <p>Owned By: ${model.owned_by || 'N/A'}</p>
        <p>Type: ${model.type || 'N/A'}</p>
    `;
}

export const contentGenerators = {
    rimunace: generateRimunaceContent,
    zanity: generateZanityContent,
    anyai: generateAnyaiContent,
    cablyai: generateCablyaiContent,
    fresedgpt: generateFresedgptContent,
    heckerai: generateHeckerContent,
    zukijourney: generateZukijourneyContent,
    shadowjourney: generateShadowjourneyContent,
    shuttleai: generateShuttleaiContent,
    electronhub: generateElectronhubContent,
    oxygen: generateOxygenContent,
    nagaai: generateNagaaiContent,
    skailar: generateSkailarContent,
    helixmind: generateHelixmindContent,
    hareproxy: generateHareproxyContent,
    webraftai: generateWebraftaiContent,
    nobrandai: generateNobrandaiContent,
    voidai: generateVoidAiContent
};