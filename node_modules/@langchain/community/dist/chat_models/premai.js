import { AIMessage, AIMessageChunk, ChatMessage, ChatMessageChunk, HumanMessageChunk, } from "@langchain/core/messages";
import { BaseChatModel, } from "@langchain/core/language_models/chat_models";
import Prem from "@premai/prem-sdk";
import { getEnvironmentVariable } from "@langchain/core/utils/env";
import { ChatGenerationChunk, } from "@langchain/core/outputs";
function extractGenericMessageCustomRole(message) {
    if (message.role !== "assistant" && message.role !== "user") {
        console.warn(`Unknown message role: ${message.role}`);
    }
    return message.role;
}
export function messageToPremRole(message) {
    const type = message._getType();
    switch (type) {
        case "ai":
            return "assistant";
        case "human":
            return "user";
        case "generic": {
            if (!ChatMessage.isInstance(message))
                throw new Error("Invalid generic chat message");
            return extractGenericMessageCustomRole(message);
        }
        default:
            throw new Error(`Unknown message type: ${type}`);
    }
}
function convertMessagesToPremParams(messages) {
    return messages.map((message) => {
        if (typeof message.content !== "string") {
            throw new Error("Non string message content not supported");
        }
        return {
            role: messageToPremRole(message),
            content: message.content,
            name: message.name,
            function_call: message.additional_kwargs.function_call,
        };
    });
}
function premResponseToChatMessage(message) {
    switch (message.role) {
        case "assistant":
            return new AIMessage(message.content || "");
        default:
            return new ChatMessage(message.content || "", message.role ?? "unknown");
    }
}
function _convertDeltaToMessageChunk(
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delta) {
    const { role } = delta;
    const content = delta.content ?? "";
    let additional_kwargs;
    if (delta.function_call) {
        additional_kwargs = {
            function_call: delta.function_call,
        };
    }
    else {
        additional_kwargs = {};
    }
    if (role === "user") {
        return new HumanMessageChunk({ content });
    }
    else if (role === "assistant") {
        return new AIMessageChunk({ content, additional_kwargs });
    }
    else {
        return new ChatMessageChunk({ content, role });
    }
}
/**
 * Integration with a chat model.
 */
export class ChatPrem extends BaseChatModel {
    // Used for tracing, replace with the same name as your class
    static lc_name() {
        return "ChatPrem";
    }
    /**
     * Replace with any secrets this class passes to `super`.
     * See {@link ../../langchain-cohere/src/chat_model.ts} for
     * an example.
     */
    get lc_secrets() {
        return {
            apiKey: "PREM_API_KEY",
        };
    }
    get lc_aliases() {
        return {
            apiKey: "PREM_API_KEY",
        };
    }
    constructor(fields) {
        super(fields ?? {});
        Object.defineProperty(this, "client", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "apiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "project_id", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "session_id", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "messages", {
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
        Object.defineProperty(this, "system_prompt", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "frequency_penalty", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "logit_bias", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "max_tokens", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "n", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "presence_penalty", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "response_format", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "seed", {
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
        Object.defineProperty(this, "top_p", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "tools", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "user", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "streaming", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "lc_serializable", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
        const apiKey = fields?.apiKey ?? getEnvironmentVariable("PREM_API_KEY");
        if (!apiKey) {
            throw new Error(`Prem API key not found. Please set the PREM_API_KEY environment variable or provide the key into "apiKey"`);
        }
        const projectId = fields?.project_id ??
            parseInt(getEnvironmentVariable("PREM_PROJECT_ID") ?? "-1", 10);
        if (!projectId || projectId === -1 || typeof projectId !== "number") {
            throw new Error(`Prem project ID not found. Please set the PREM_PROJECT_ID environment variable or provide the key into "project_id"`);
        }
        this.client = new Prem({
            apiKey,
        });
        this.project_id = projectId;
        this.session_id = fields?.session_id ?? this.session_id;
        this.messages = fields?.messages ?? this.messages;
        this.model = fields?.model ?? this.model;
        this.system_prompt = fields?.system_prompt ?? this.system_prompt;
        this.frequency_penalty =
            fields?.frequency_penalty ?? this.frequency_penalty;
        this.logit_bias = fields?.logit_bias ?? this.logit_bias;
        this.max_tokens = fields?.max_tokens ?? this.max_tokens;
        this.n = fields?.n ?? this.n;
        this.presence_penalty = fields?.presence_penalty ?? this.presence_penalty;
        this.response_format = fields?.response_format ?? this.response_format;
        this.seed = fields?.seed ?? this.seed;
        this.stop = fields?.stop ?? this.stop;
        this.temperature = fields?.temperature ?? this.temperature;
        this.top_p = fields?.top_p ?? this.top_p;
        this.tools = fields?.tools ?? this.tools;
        this.user = fields?.user ?? this.user;
        this.streaming = fields?.streaming ?? this.streaming;
    }
    // Replace
    _llmType() {
        return "prem";
    }
    async completionWithRetry(request, 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options) {
        return this.caller.call(async () => this.client.chat.completions.create(request, options));
    }
    invocationParams(options) {
        const params = super.invocationParams(options);
        return {
            ...params,
            project_id: this.project_id,
            session_id: this.session_id,
            messages: this.messages,
            model: this.model,
            system_prompt: this.system_prompt,
            frequency_penalty: this.frequency_penalty,
            logit_bias: this.logit_bias,
            max_tokens: this.max_tokens,
            n: this.n,
            presence_penalty: this.presence_penalty,
            response_format: this.response_format,
            seed: this.seed,
            stop: this.stop,
            temperature: this.temperature,
            top_p: this.top_p,
            tools: this.tools,
            user: this.user,
            streaming: this.streaming,
            stream: this.streaming,
        };
    }
    /**
     * Implement to support streaming.
     * Should yield chunks iteratively.
     */
    async *_streamResponseChunks(messages, options, runManager) {
        const params = this.invocationParams(options);
        const messagesMapped = convertMessagesToPremParams(messages);
        // All models have a built-in `this.caller` property for retries
        const stream = await this.caller.call(async () => this.completionWithRetry({
            ...params,
            messages: messagesMapped,
            stream: true,
        }, params));
        for await (const data of stream) {
            const choice = data?.choices[0];
            if (!choice) {
                continue;
            }
            const chunk = new ChatGenerationChunk({
                message: _convertDeltaToMessageChunk(choice.delta ?? {}),
                text: choice.delta.content ?? "",
                generationInfo: {
                    finishReason: choice.finish_reason,
                },
            });
            yield chunk;
            void runManager?.handleLLMNewToken(chunk.text ?? "");
        }
        if (options.signal?.aborted) {
            throw new Error("AbortError");
        }
    }
    /** @ignore */
    _combineLLMOutput() {
        return [];
    }
    async _generate(messages, options, runManager) {
        const tokenUsage = {};
        const params = this.invocationParams(options);
        const messagesMapped = convertMessagesToPremParams(messages);
        if (params.streaming) {
            const stream = this._streamResponseChunks(messages, options, runManager);
            const finalChunks = {};
            for await (const chunk of stream) {
                const index = chunk.generationInfo?.completion ?? 0;
                if (finalChunks[index] === undefined) {
                    finalChunks[index] = chunk;
                }
                else {
                    finalChunks[index] = finalChunks[index].concat(chunk);
                }
            }
            const generations = Object.entries(finalChunks)
                .sort(([aKey], [bKey]) => parseInt(aKey, 10) - parseInt(bKey, 10))
                .map(([_, value]) => value);
            return { generations, llmOutput: { estimatedTokenUsage: tokenUsage } };
        }
        else {
            const data = await this.completionWithRetry({
                ...params,
                stream: false,
                messages: messagesMapped,
            }, {
                signal: options?.signal,
            });
            if ("usage" in data && data.usage) {
                const { completion_tokens: completionTokens, prompt_tokens: promptTokens, total_tokens: totalTokens, } = data.usage;
                if (completionTokens) {
                    tokenUsage.completionTokens =
                        (tokenUsage.completionTokens ?? 0) + completionTokens;
                }
                if (promptTokens) {
                    tokenUsage.promptTokens =
                        (tokenUsage.promptTokens ?? 0) + promptTokens;
                }
                if (totalTokens) {
                    tokenUsage.totalTokens = (tokenUsage.totalTokens ?? 0) + totalTokens;
                }
            }
            const generations = [];
            if ("choices" in data && data.choices) {
                for (const part of data
                    .choices) {
                    const text = part.message?.content ?? "";
                    const generation = {
                        text,
                        message: premResponseToChatMessage(part.message ?? { role: "assistant" }),
                    };
                    generation.generationInfo = {
                        ...(part.finish_reason
                            ? { finish_reason: part.finish_reason }
                            : {}),
                        ...(part.logprobs ? { logprobs: part.logprobs } : {}),
                    };
                    generations.push(generation);
                }
            }
            return {
                generations,
                llmOutput: { tokenUsage },
            };
        }
    }
}
