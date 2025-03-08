export function generateRimunaceContent(model) {
  const accessTiers = Object.entries(model.access)
    .filter(([_, v]) => v)
    .map(([k]) => k.charAt(0).toUpperCase() + k.slice(1))
    .join(", ");

  return `
        <p>Type: ${model.type}</p>
        <p>Owner: ${model.owned_by}</p>
        <p>Cost: ${model.cost} / request</p>
        ${accessTiers ? `<p>Access: ${accessTiers}</p>` : ""}
    `;
}

export function generateZanityContent(model) {
  return `
        <p>Type: ${model.type}</p>
        <p>Owned by: ${model.owned_by}</p>
        <p>Cost: ${model.cost}</p>
        <p>Access: ${
          Object.entries(model.access)
            .filter(([k, v]) => v)
            .map(([k]) => k.charAt(0).toUpperCase() + k.slice(1))
            .join(", ") || "None"
        }</p>
    `;
}

export function generateAnyaiContent(model) {
  return `
        <p>Open Source: ${model.created === 0 ? "Yes" : "No"}</p>
        <p>Owner: ${model.owned_by}</p>
        <p>Object: ${model.object}</p>
    `;
}

export function generateCablyaiContent(model) {
  return `
        <p>Owner: ${model.owned_by}</p>
        <p>Type: ${model.type}</p>
        <p>Vision Supported: ${model.support_vision ? "Yes" : "No"}</p>
    `;
}

export function generateFresedgptContent(model) {
  return `
        <p>Owner: ${model.owned_by}</p>
        <p>Token Coefficient: ${model.token_coefficient}</p>
        <p>Max Tokens: ${model.max_tokens || "N/A"}</p>
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
        <p>Supports Vision: ${model.supports_vision ? "Yes" : "No"}</p>
        <p>Is Free: ${model.is_free ? "Yes" : "No"}</p>
    `;
}

export function generateShadowjourneyContent(model) {
  const cost =
    model.cost === "free"
      ? "False"
      : model.cost === "premium"
      ? "True"
      : "False";
  return `
        <p>Owned By: ${model.owned_by}</p>
        <p>Object: ${model.object}</p>
        <p>Premium: ${cost}</p>
    `;
}

export function generateShuttleaiContent(model) {
  let pricingInfo = "";

  if (model.pricing) {
    if (model.pricing.type === "tokens") {
      pricingInfo = `
                <p>Pricing Type: ${model.pricing.type}</p>
                <p>Input Cost: $${model.pricing.in_cost_per_million}/M tokens</p>
                <p>Output Cost: $${model.pricing.out_cost_per_million}/M tokens</p>
            `;
    } else if (model.pricing.type === "image") {
      pricingInfo = `
                <p>Pricing Type: ${model.pricing.type}</p>
                <p>Cost per Image: $${model.pricing.cost_per_image}</p>
            `;
    } else if (model.pricing.type === "time") {
      pricingInfo = `
                <p>Pricing Type: ${model.pricing.type}</p>
                <p>Cost per Second: $${model.pricing.cost_per_second}</p>
            `;
    } else if (model.pricing.type === "characters") {
      pricingInfo = `
                <p>Pricing Type: ${model.pricing.type}</p>
                <p>Cost per Million: $${model.pricing.cost_per_million}</p>
            `;
    } else if (model.pricing.type === "request") {
      pricingInfo = `
                <p>Pricing Type: ${model.pricing.type}</p>
                <p>Cost per Request: $${model.pricing.cost_per_request}</p>
            `;
    }
  }

  const proxyInfo = model.proxy_to ? `<p>Proxy to: ${model.proxy_to}</p>` : "";

  return `
        <p>ID: ${model.id || "N/A"}</p>
        <p>Object: ${model.object || "N/A"}</p>
        <p>Created: ${
          model.created
            ? new Date(model.created * 1000).toLocaleDateString()
            : "N/A"
        }</p>
        <p>Owned by: ${model.owned_by || "N/A"}</p>
        ${proxyInfo}
        ${pricingInfo}
    `;
}

export function generateElectronhubContent(model) {
  return `
        <p>Object: ${model.object ? model.object : "N/A"}</p>
        <p>Owned By: ${model.owned_by ? model.owned_by : "N/A"}</p>
        <p>Max Tokens: ${model.tokens ? model.tokens : "N/A"}</p>
        <p>Created: ${model.created ? model.created : "N/A"}</p>
        <p>Premium Model: ${
          model.premium_model !== undefined
            ? model.premium_model
              ? "Yes"
              : "No"
            : "N/A"
        }</p>
        <p>Vision: ${
          model.metadata?.vision !== undefined
            ? model.metadata.vision
              ? "Yes"
              : "No"
            : "N/A"
        }</p>
        <p>Function Call: ${
          model.metadata?.function_call !== undefined
            ? model.metadata.function_call
              ? "Yes"
              : "No"
            : "N/A"
        }</p>
        <p>Web Search: ${
          model.metadata?.web_search !== undefined
            ? model.metadata.web_search
              ? "Yes"
              : "No"
            : "N/A"
        }</p>
        <p>Pricing Type: ${model.pricing?.type ? model.pricing.type : "N/A"}</p>
        <p>Pricing Coefficient: ${
          model.pricing?.coefficient ? model.pricing.coefficient : "N/A"
        }</p>
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
        <p>Object: ${model.object || "N/A"}</p>
        <p>Limiter: ${model.limiter || "N/A"}</p>
        <p>Points To: ${model.points_to || "N/A"}</p>
        <p>Per Input Token: ${
          model.pricing && model.pricing.per_input_token
            ? "$" + model.pricing.per_input_token
            : "N/A"
        }</p>
        <p>Per Output Token: ${
          model.pricing && model.pricing.per_output_token
            ? "$" + model.pricing.per_output_token
            : "N/A"
        }</p>
    `;
}

export function generateSkailarContent(model) {
  return `
        <p>Object: ${model.object || "N/A"}</p>
        <p>Created: ${model.created || "N/A"}</p>
        <p>Type: ${model.type || "N/A"}</p>
        <p>Premium: ${
          model.premium !== undefined ? (model.premium ? "Yes" : "No") : "N/A"
        }</p>
        <p>Enabled: ${
          model.enabled !== undefined ? (model.enabled ? "Yes" : "No") : "N/A"
        }</p>
        <p>Endpoint: ${model.endpoint || "N/A"}</p>
        <p>Max Tokens: ${
          model.max_tokens !== undefined ? model.max_tokens : "N/A"
        }</p>
    `;
}

export function generateHelixmindContent(model) {
  return `
        <p>Object: ${model.object || "N/A"}</p>
        <p>Owned By: ${model.owned_by || "N/A"}</p>
    `;
}

export function generateWebraftaiContent(model) {
  return `
        <p>Object: ${model.object || "N/A"}</p>
        <p>Premium: ${
          model.premium !== undefined ? (model.premium ? "Yes" : "No") : "N/A"
        }</p>
        <p>Free Credits: ${
          model.free_credits !== undefined ? model.free_credits : "N/A"
        }</p>
    `;
}

export function generateVoidAiContent(model) {
  return `
        <p>Object: ${model.object || "N/A"}</p>
        <p>Owned By: ${model.owned_by || "N/A"}</p>
        <p>Type: ${model.type || "N/A"}</p>
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
  webraftai: generateWebraftaiContent,
  voidai: generateVoidAiContent,
};
