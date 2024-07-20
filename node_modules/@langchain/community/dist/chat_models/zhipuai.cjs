"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatZhipuAI = void 0;
const chat_models_1 = require("@langchain/core/language_models/chat_models");
const messages_1 = require("@langchain/core/messages");
const outputs_1 = require("@langchain/core/outputs");
const env_1 = require("@langchain/core/utils/env");
const zhipuai_js_1 = require("../utils/zhipuai.cjs");
const event_source_parse_js_1 = require("../utils/event_source_parse.cjs");
function messageToRole(message) {
    const type = message._getType();
    switch (type) {
        case "ai":
            return "assistant";
        case "human":
            return "user";
        case "system":
            return "system";
        case "function":
            throw new Error("Function messages not supported yet");
        case "generic": {
            if (!messages_1.ChatMessage.isInstance(message)) {
                throw new Error("Invalid generic chat message");
            }
            if (["system", "assistant", "user"].includes(message.role)) {
                return message.role;
            }
            throw new Error(`Unknown message type: ${type}`);
        }
        default:
            throw new Error(`Unknown message type: ${type}`);
    }
}
class ChatZhipuAI extends chat_models_1.BaseChatModel {
    static lc_name() {
        return "ChatZhipuAI";
    }
    get callKeys() {
        return ["stop", "signal", "options"];
    }
    get lc_secrets() {
        return {
            zhipuAIApiKey: "ZHIPUAI_API_KEY",
            apiKey: "ZHIPUAI_API_KEY",
        };
    }
    get lc_aliases() {
        return undefined;
    }
    constructor(fields = {}) {
        super(fields);
        Object.defineProperty(this, "zhipuAIApiKey", {
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
        Object.defineProperty(this, "streaming", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "doSample", {
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
        Object.defineProperty(this, "requestId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "modelName", {
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
        Object.defineProperty(this, "topP", {
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
        this.zhipuAIApiKey =
            fields?.apiKey ??
                fields?.zhipuAIApiKey ??
                (0, env_1.getEnvironmentVariable)("ZHIPUAI_API_KEY");
        if (!this.zhipuAIApiKey) {
            throw new Error("ZhipuAI API key not found");
        }
        this.apiUrl = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
        this.streaming = fields.streaming ?? false;
        this.messages = fields.messages ?? [];
        this.temperature = fields.temperature ?? 0.95;
        this.topP = fields.topP ?? 0.7;
        this.stop = fields.stop;
        this.maxTokens = fields.maxTokens;
        this.modelName = fields?.model ?? fields.modelName ?? "glm-3-turbo";
        this.model = this.modelName;
        this.doSample = fields.doSample;
    }
    /**
     * Get the parameters used to invoke the model
     */
    invocationParams() {
        return {
            model: this.model,
            request_id: this.requestId,
            do_sample: this.doSample,
            stream: this.streaming,
            temperature: this.temperature,
            top_p: this.topP,
            max_tokens: this.maxTokens,
            stop: this.stop,
        };
    }
    /**
     * Get the identifying parameters for the model
     */
    identifyingParams() {
        return this.invocationParams();
    }
    /** @ignore */
    async _generate(messages, options, runManager) {
        const parameters = this.invocationParams();
        const messagesMapped = messages.map((message) => ({
            role: messageToRole(message),
            content: message.content,
        }));
        const data = parameters.stream
            ? await new Promise((resolve, reject) => {
                let response;
                let rejected = false;
                let resolved = false;
                this.completionWithRetry({
                    ...parameters,
                    messages: messagesMapped,
                }, true, options?.signal, (event) => {
                    const data = JSON.parse(event.data);
                    if (data?.error?.code) {
                        if (rejected) {
                            return;
                        }
                        rejected = true;
                        reject(new Error(data?.error?.message));
                        return;
                    }
                    const { delta, finish_reason } = data.choices[0];
                    const text = delta.content;
                    if (!response) {
                        response = {
                            ...data,
                            output: { text, finish_reason },
                        };
                    }
                    else {
                        response.output.text += text;
                        response.output.finish_reason = finish_reason;
                        response.usage = data.usage;
                    }
                    void runManager?.handleLLMNewToken(text ?? "");
                    if (finish_reason && finish_reason !== "null") {
                        if (resolved || rejected)
                            return;
                        resolved = true;
                        resolve(response);
                    }
                }).catch((error) => {
                    if (!rejected) {
                        rejected = true;
                        reject(error);
                    }
                });
            })
            : await this.completionWithRetry({
                ...parameters,
                messages: messagesMapped,
            }, false, options?.signal).then((data) => {
                if (data?.error?.code) {
                    throw new Error(data?.error?.message);
                }
                const { finish_reason, message } = data.choices[0];
                const text = message.content;
                return {
                    ...data,
                    output: { text, finish_reason },
                };
            });
        const { prompt_tokens = 0, completion_tokens = 0, total_tokens = 0, } = data.usage;
        const { text } = data.output;
        return {
            generations: [
                {
                    text,
                    message: new messages_1.AIMessage(text),
                },
            ],
            llmOutput: {
                tokenUsage: {
                    promptTokens: prompt_tokens,
                    completionTokens: completion_tokens,
                    totalTokens: total_tokens,
                },
            },
        };
    }
    /** @ignore */
    async completionWithRetry(request, stream, signal, onmessage) {
        const makeCompletionRequest = async () => {
            const response = await fetch(this.apiUrl, {
                method: "POST",
                headers: {
                    ...(stream ? { Accept: "text/event-stream" } : {}),
                    Authorization: `Bearer ${(0, zhipuai_js_1.encodeApiKey)(this.zhipuAIApiKey)}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(request),
                signal,
            });
            if (!stream) {
                return response.json();
            }
            if (response.body) {
                // response will not be a stream if an error occurred
                if (!response.headers.get("content-type")?.startsWith("text/event-stream")) {
                    onmessage?.(new MessageEvent("message", {
                        data: await response.text(),
                    }));
                    return;
                }
                const reader = response.body.getReader();
                const decoder = new TextDecoder("utf-8");
                let data = "";
                let continueReading = true;
                while (continueReading) {
                    const { done, value } = await reader.read();
                    if (done) {
                        continueReading = false;
                        break;
                    }
                    data += decoder.decode(value);
                    let continueProcessing = true;
                    while (continueProcessing) {
                        const newlineIndex = data.indexOf("\n");
                        if (newlineIndex === -1) {
                            continueProcessing = false;
                            break;
                        }
                        const line = data.slice(0, newlineIndex);
                        data = data.slice(newlineIndex + 1);
                        if (line.startsWith("data:")) {
                            const value = line.slice("data:".length).trim();
                            if (value === "[DONE]") {
                                continueReading = false;
                                break;
                            }
                            const event = new MessageEvent("message", { data: value });
                            onmessage?.(event);
                        }
                    }
                }
            }
        };
        return this.caller.call(makeCompletionRequest);
    }
    async createZhipuStream(request, signal) {
        const response = await fetch(this.apiUrl, {
            method: "POST",
            headers: {
                Accept: "text/event-stream",
                Authorization: `Bearer ${(0, zhipuai_js_1.encodeApiKey)(this.zhipuAIApiKey)}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(request),
            signal,
        });
        if (!response.body) {
            throw new Error("Could not begin Zhipu stream. Please check the given URL and try again.");
        }
        return (0, event_source_parse_js_1.convertEventStreamToIterableReadableDataStream)(response.body);
    }
    _deserialize(json) {
        try {
            return JSON.parse(json);
        }
        catch (e) {
            console.warn(`Received a non-JSON parseable chunk: ${json}`);
        }
    }
    async *_streamResponseChunks(messages, options, runManager) {
        const parameters = {
            ...this.invocationParams(),
            stream: true,
        };
        const messagesMapped = messages.map((message) => ({
            role: messageToRole(message),
            content: message.content,
        }));
        const stream = await this.caller.call(async () => this.createZhipuStream({
            ...parameters,
            messages: messagesMapped,
        }, options?.signal));
        for await (const chunk of stream) {
            if (chunk !== "[DONE]") {
                const deserializedChunk = this._deserialize(chunk);
                const { choices, id } = deserializedChunk;
                const text = choices[0]?.delta?.content ?? "";
                const finished = !!choices[0]?.finish_reason;
                yield new outputs_1.ChatGenerationChunk({
                    text,
                    message: new messages_1.AIMessageChunk({ content: text }),
                    generationInfo: finished
                        ? {
                            finished,
                            request_id: id,
                            usage: chunk.usage,
                        }
                        : undefined,
                });
                await runManager?.handleLLMNewToken(text);
            }
            else {
                continue;
            }
        }
    }
    _llmType() {
        return "zhipuai";
    }
    /** @ignore */
    _combineLLMOutput() {
        return [];
    }
}
exports.ChatZhipuAI = ChatZhipuAI;
