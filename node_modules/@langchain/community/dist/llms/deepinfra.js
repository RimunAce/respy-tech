import { LLM } from "@langchain/core/language_models/llms";
import { getEnvironmentVariable } from "@langchain/core/utils/env";
export const DEEPINFRA_API_BASE = "https://api.deepinfra.com/v1/openai/completions";
export const DEFAULT_MODEL_NAME = "mistralai/Mixtral-8x22B-Instruct-v0.1";
export const ENV_VARIABLE = "DEEPINFRA_API_TOKEN";
export class DeepInfraLLM extends LLM {
    static lc_name() {
        return "DeepInfraLLM";
    }
    constructor(fields = {}) {
        super(fields);
        Object.defineProperty(this, "lc_serializable", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
        Object.defineProperty(this, "apiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "model", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "maxTokens", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "temperature", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.apiKey = fields.apiKey ?? getEnvironmentVariable(ENV_VARIABLE);
        this.model = fields.model ?? DEFAULT_MODEL_NAME;
        this.maxTokens = fields.maxTokens;
        this.temperature = fields.temperature;
    }
    _llmType() {
        return "DeepInfra";
    }
    async _call(prompt, options) {
        const body = {
            temperature: this.temperature,
            max_tokens: this.maxTokens,
            ...options,
            prompt,
            model: this.model,
        };
        const response = await this.caller.call(() => fetch(DEEPINFRA_API_BASE, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        }).then((res) => res.json()));
        return response;
    }
}
