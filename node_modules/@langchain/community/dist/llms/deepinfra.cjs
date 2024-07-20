"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeepInfraLLM = exports.ENV_VARIABLE = exports.DEFAULT_MODEL_NAME = exports.DEEPINFRA_API_BASE = void 0;
const llms_1 = require("@langchain/core/language_models/llms");
const env_1 = require("@langchain/core/utils/env");
exports.DEEPINFRA_API_BASE = "https://api.deepinfra.com/v1/openai/completions";
exports.DEFAULT_MODEL_NAME = "mistralai/Mixtral-8x22B-Instruct-v0.1";
exports.ENV_VARIABLE = "DEEPINFRA_API_TOKEN";
class DeepInfraLLM extends llms_1.LLM {
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
        this.apiKey = fields.apiKey ?? (0, env_1.getEnvironmentVariable)(exports.ENV_VARIABLE);
        this.model = fields.model ?? exports.DEFAULT_MODEL_NAME;
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
        const response = await this.caller.call(() => fetch(exports.DEEPINFRA_API_BASE, {
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
exports.DeepInfraLLM = DeepInfraLLM;
