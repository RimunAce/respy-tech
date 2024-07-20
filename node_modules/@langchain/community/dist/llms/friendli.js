import { LLM, } from "@langchain/core/language_models/llms";
import { GenerationChunk } from "@langchain/core/outputs";
import { getEnvironmentVariable } from "@langchain/core/utils/env";
import { convertEventStreamToIterableReadableDataStream } from "../utils/event_source_parse.js";
/**
 * The Friendli class is used to interact with Friendli inference Endpoint models.
 * This requires your Friendli Token and Friendli Team which is autoloaded if not specified.
 */
export class Friendli extends LLM {
    static lc_name() {
        return "Friendli";
    }
    get lc_secrets() {
        return {
            friendliToken: "FRIENDLI_TOKEN",
            friendliTeam: "FRIENDLI_TEAM",
        };
    }
    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "lc_serializable", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
        Object.defineProperty(this, "model", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "mixtral-8x7b-instruct-v0-1"
        });
        Object.defineProperty(this, "baseUrl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "https://inference.friendli.ai"
        });
        Object.defineProperty(this, "friendliToken", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "friendliTeam", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "frequencyPenalty", {
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
        Object.defineProperty(this, "stop", {
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
        Object.defineProperty(this, "topP", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "modelKwargs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.model = fields?.model ?? this.model;
        this.baseUrl = fields?.baseUrl ?? this.baseUrl;
        this.friendliToken =
            fields?.friendliToken ?? getEnvironmentVariable("FRIENDLI_TOKEN");
        this.friendliTeam =
            fields?.friendliTeam ?? getEnvironmentVariable("FRIENDLI_TEAM");
        this.frequencyPenalty = fields?.frequencyPenalty ?? this.frequencyPenalty;
        this.maxTokens = fields?.maxTokens ?? this.maxTokens;
        this.stop = fields?.stop ?? this.stop;
        this.temperature = fields?.temperature ?? this.temperature;
        this.topP = fields?.topP ?? this.topP;
        this.modelKwargs = fields?.modelKwargs ?? {};
        if (!this.friendliToken) {
            throw new Error("Missing Friendli Token");
        }
    }
    _llmType() {
        return "friendli";
    }
    constructHeaders(stream) {
        return {
            "Content-Type": "application/json",
            Accept: stream ? "text/event-stream" : "application/json",
            Authorization: `Bearer ${this.friendliToken}`,
            "X-Friendli-Team": this.friendliTeam ?? "",
        };
    }
    constructBody(prompt, stream, _options) {
        const body = JSON.stringify({
            prompt,
            stream,
            model: this.model,
            max_tokens: this.maxTokens,
            frequency_penalty: this.frequencyPenalty,
            stop: this.stop,
            temperature: this.temperature,
            top_p: this.topP,
            ...this.modelKwargs,
        });
        return body;
    }
    /**
     * Calls the Friendli endpoint and retrieves the result.
     * @param {string} prompt The input prompt.
     * @returns {Promise<string>} A promise that resolves to the generated string.
     */
    /** @ignore */
    async _call(prompt, _options) {
        const response = (await this.caller.call(async () => fetch(`${this.baseUrl}/v1/completions`, {
            method: "POST",
            headers: this.constructHeaders(false),
            body: this.constructBody(prompt, false, _options),
        }).then((res) => res.json())));
        return response.choices[0].text;
    }
    async *_streamResponseChunks(prompt, _options, runManager) {
        const response = await this.caller.call(async () => fetch(`${this.baseUrl}/v1/completions`, {
            method: "POST",
            headers: this.constructHeaders(true),
            body: this.constructBody(prompt, true, _options),
        }));
        if (response.status !== 200 ?? !response.body) {
            const errorResponse = await response.json();
            throw new Error(JSON.stringify(errorResponse));
        }
        const stream = convertEventStreamToIterableReadableDataStream(response.body);
        for await (const chunk of stream) {
            if (chunk.event !== "complete") {
                const parsedChunk = JSON.parse(chunk);
                const generationChunk = new GenerationChunk({
                    text: parsedChunk.text ?? "",
                });
                yield generationChunk;
                void runManager?.handleLLMNewToken(generationChunk.text ?? "");
            }
            else {
                const parsedChunk = JSON.parse(chunk);
                const generationChunk = new GenerationChunk({
                    text: "",
                    generationInfo: {
                        choices: parsedChunk.choices,
                        usage: parsedChunk.usage,
                    },
                });
                yield generationChunk;
            }
        }
    }
}
