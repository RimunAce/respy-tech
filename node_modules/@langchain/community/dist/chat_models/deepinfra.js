import { BaseChatModel, } from "@langchain/core/language_models/chat_models";
import { AIMessage } from "@langchain/core/messages";
import { getEnvironmentVariable } from "@langchain/core/utils/env";
export const DEFAULT_MODEL = "meta-llama/Meta-Llama-3-70B-Instruct";
export const API_BASE_URL = "https://api.deepinfra.com/v1/openai/chat/completions";
export const ENV_VARIABLE_API_KEY = "DEEPINFRA_API_TOKEN";
function messageToRole(message) {
    const type = message._getType();
    switch (type) {
        case "ai":
            return "assistant";
        case "human":
            return "user";
        case "system":
            return "system";
        default:
            throw new Error(`Unknown message type: ${type}`);
    }
}
export class ChatDeepInfra extends BaseChatModel {
    static lc_name() {
        return "ChatDeepInfra";
    }
    get callKeys() {
        return ["stop", "signal", "options"];
    }
    constructor(fields = {}) {
        super(fields);
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
        Object.defineProperty(this, "apiUrl", {
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
        this.apiKey =
            fields?.apiKey ?? getEnvironmentVariable(ENV_VARIABLE_API_KEY);
        if (!this.apiKey) {
            throw new Error("API key is required, set `DEEPINFRA_API_TOKEN` environment variable or pass it as a parameter");
        }
        this.apiUrl = API_BASE_URL;
        this.model = fields.model ?? DEFAULT_MODEL;
        this.temperature = fields.temperature ?? 0;
        this.maxTokens = fields.maxTokens;
    }
    invocationParams() {
        return {
            model: this.model,
            stream: false,
            temperature: this.temperature,
            max_tokens: this.maxTokens,
        };
    }
    identifyingParams() {
        return this.invocationParams();
    }
    async _generate(messages, options) {
        const parameters = this.invocationParams();
        const messagesMapped = messages.map((message) => ({
            role: messageToRole(message),
            content: message.content,
        }));
        const data = await this.completionWithRetry({ ...parameters, messages: messagesMapped }, false, options?.signal).then((data) => {
            if (data?.code) {
                throw new Error(data?.message);
            }
            const { finish_reason, message } = data.choices[0];
            const text = message.content;
            return {
                ...data,
                output: { text, finish_reason },
            };
        });
        const { prompt_tokens = 0, completion_tokens = 0, total_tokens = 0, } = data.usage ?? {};
        const { text } = data.output;
        return {
            generations: [{ text, message: new AIMessage(text) }],
            llmOutput: {
                tokenUsage: {
                    promptTokens: prompt_tokens,
                    completionTokens: completion_tokens,
                    totalTokens: total_tokens,
                },
            },
        };
    }
    async completionWithRetry(request, stream, signal) {
        const body = {
            temperature: this.temperature,
            max_tokens: this.maxTokens,
            ...request,
            model: this.model,
        };
        const makeCompletionRequest = async () => {
            const response = await fetch(this.apiUrl, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
                signal,
            });
            if (!stream) {
                return response.json();
            }
        };
        return this.caller.call(makeCompletionRequest);
    }
    _llmType() {
        return "DeepInfra";
    }
}
