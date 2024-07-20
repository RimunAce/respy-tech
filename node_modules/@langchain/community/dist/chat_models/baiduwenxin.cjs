"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatBaiduWenxin = void 0;
const chat_models_1 = require("@langchain/core/language_models/chat_models");
const messages_1 = require("@langchain/core/messages");
const outputs_1 = require("@langchain/core/outputs");
const env_1 = require("@langchain/core/utils/env");
const event_source_parse_js_1 = require("../utils/event_source_parse.cjs");
/**
 * Function that extracts the custom role of a generic chat message.
 * @param message Chat message from which to extract the custom role.
 * @returns The custom role of the chat message.
 */
function extractGenericMessageCustomRole(message) {
    if (message.role !== "assistant" && message.role !== "user") {
        console.warn(`Unknown message role: ${message.role}`);
    }
    return message.role;
}
/**
 * Function that converts a base message to a Wenxin message role.
 * @param message Base message to convert.
 * @returns The Wenxin message role.
 */
function messageToWenxinRole(message) {
    const type = message._getType();
    switch (type) {
        case "ai":
            return "assistant";
        case "human":
            return "user";
        case "system":
            throw new Error("System messages should not be here");
        case "function":
            throw new Error("Function messages not supported");
        case "generic": {
            if (!messages_1.ChatMessage.isInstance(message))
                throw new Error("Invalid generic chat message");
            return extractGenericMessageCustomRole(message);
        }
        default:
            throw new Error(`Unknown message type: ${type}`);
    }
}
/**
 * @deprecated Install and import from @langchain/baidu-qianfan instead.
 * Wrapper around Baidu ERNIE large language models that use the Chat endpoint.
 *
 * To use you should have the `BAIDU_API_KEY` and `BAIDU_SECRET_KEY`
 * environment variable set.
 *
 * @augments BaseLLM
 * @augments BaiduERNIEInput
 * @example
 * ```typescript
 * const ernieTurbo = new ChatBaiduWenxin({
 *   apiKey: "YOUR-API-KEY",
 *   baiduSecretKey: "YOUR-SECRET-KEY",
 * });
 *
 * const ernie = new ChatBaiduWenxin({
 *   model: "ERNIE-Bot",
 *   temperature: 1,
 *   apiKey: "YOUR-API-KEY",
 *   baiduSecretKey: "YOUR-SECRET-KEY",
 * });
 *
 * const messages = [new HumanMessage("Hello")];
 *
 * let res = await ernieTurbo.call(messages);
 *
 * res = await ernie.call(messages);
 * ```
 */
class ChatBaiduWenxin extends chat_models_1.BaseChatModel {
    static lc_name() {
        return "ChatBaiduWenxin";
    }
    get callKeys() {
        return ["stop", "signal", "options"];
    }
    get lc_secrets() {
        return {
            baiduApiKey: "BAIDU_API_KEY",
            apiKey: "BAIDU_API_KEY",
            baiduSecretKey: "BAIDU_SECRET_KEY",
        };
    }
    get lc_aliases() {
        return undefined;
    }
    constructor(fields) {
        super(fields ?? {});
        Object.defineProperty(this, "lc_serializable", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
        Object.defineProperty(this, "baiduApiKey", {
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
        Object.defineProperty(this, "baiduSecretKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "accessToken", {
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
        Object.defineProperty(this, "prefixMessages", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "userId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "modelName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "ERNIE-Bot-turbo"
        });
        Object.defineProperty(this, "model", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "ERNIE-Bot-turbo"
        });
        Object.defineProperty(this, "apiUrl", {
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
        Object.defineProperty(this, "penaltyScore", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.baiduApiKey =
            fields?.apiKey ??
                fields?.baiduApiKey ??
                (0, env_1.getEnvironmentVariable)("BAIDU_API_KEY");
        if (!this.baiduApiKey) {
            throw new Error("Baidu API key not found");
        }
        this.apiKey = this.baiduApiKey;
        this.baiduSecretKey =
            fields?.baiduSecretKey ?? (0, env_1.getEnvironmentVariable)("BAIDU_SECRET_KEY");
        if (!this.baiduSecretKey) {
            throw new Error("Baidu Secret key not found");
        }
        this.streaming = fields?.streaming ?? this.streaming;
        this.prefixMessages = fields?.prefixMessages ?? this.prefixMessages;
        this.userId = fields?.userId ?? this.userId;
        this.temperature = fields?.temperature ?? this.temperature;
        this.topP = fields?.topP ?? this.topP;
        this.penaltyScore = fields?.penaltyScore ?? this.penaltyScore;
        this.modelName = fields?.model ?? fields?.modelName ?? this.model;
        this.model = this.modelName;
        const models = {
            "ERNIE-Bot": "completions",
            "ERNIE-Bot-turbo": "eb-instant",
            "ERNIE-Bot-4": "completions_pro",
            "ERNIE-Speed-8K": "ernie_speed",
            "ERNIE-Speed-128K": "ernie-speed-128k",
            "ERNIE-4.0-8K": "completions_pro",
            "ERNIE-4.0-8K-Preview": "ernie-4.0-8k-preview",
            "ERNIE-3.5-8K": "completions",
            "ERNIE-3.5-8K-Preview": "ernie-3.5-8k-preview",
            "ERNIE-Lite-8K": "eb-instant",
            "ERNIE-Tiny-8K": "ernie-tiny-8k",
            "ERNIE-Character-8K": "ernie-char-8k",
            "ERNIE Speed-AppBuilder": "ai_apaas",
        };
        if (this.model in models) {
            this.apiUrl = `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/${models[this.model]}`;
        }
        else {
            throw new Error(`Invalid model name: ${this.model}`);
        }
    }
    /**
     * Method that retrieves the access token for making requests to the Baidu
     * API.
     * @param options Optional parsed call options.
     * @returns The access token for making requests to the Baidu API.
     */
    async getAccessToken(options) {
        const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${this.apiKey}&client_secret=${this.baiduSecretKey}`;
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            signal: options?.signal,
        });
        if (!response.ok) {
            const text = await response.text();
            const error = new Error(`Baidu get access token failed with status code ${response.status}, response: ${text}`);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            error.response = response;
            throw error;
        }
        const json = await response.json();
        return json.access_token;
    }
    /**
     * Get the parameters used to invoke the model
     */
    invocationParams() {
        return {
            stream: this.streaming,
            user_id: this.userId,
            temperature: this.temperature,
            top_p: this.topP,
            penalty_score: this.penaltyScore,
        };
    }
    /**
     * Get the identifying parameters for the model
     */
    identifyingParams() {
        return {
            model_name: this.model,
            ...this.invocationParams(),
        };
    }
    _ensureMessages(messages) {
        return messages.map((message) => ({
            role: messageToWenxinRole(message),
            content: message.text,
        }));
    }
    /** @ignore */
    async _generate(messages, options, runManager) {
        const tokenUsage = {};
        const params = this.invocationParams();
        // Wenxin requires the system message to be put in the params, not messages array
        const systemMessage = messages.find((message) => message._getType() === "system");
        if (systemMessage) {
            // eslint-disable-next-line no-param-reassign
            messages = messages.filter((message) => message !== systemMessage);
            params.system = systemMessage.text;
        }
        const messagesMapped = this._ensureMessages(messages);
        const data = params.stream
            ? await new Promise((resolve, reject) => {
                let response;
                let rejected = false;
                let resolved = false;
                this.completionWithRetry({
                    ...params,
                    messages: messagesMapped,
                }, true, options?.signal, (event) => {
                    const data = JSON.parse(event.data);
                    if (data?.error_code) {
                        if (rejected) {
                            return;
                        }
                        rejected = true;
                        reject(new Error(data?.error_msg));
                        return;
                    }
                    const message = data;
                    // on the first message set the response properties
                    if (!response) {
                        response = {
                            id: message.id,
                            object: message.object,
                            created: message.created,
                            result: message.result,
                            need_clear_history: message.need_clear_history,
                            usage: message.usage,
                        };
                    }
                    else {
                        response.result += message.result;
                        response.created = message.created;
                        response.need_clear_history = message.need_clear_history;
                        response.usage = message.usage;
                    }
                    // TODO this should pass part.index to the callback
                    // when that's supported there
                    // eslint-disable-next-line no-void
                    void runManager?.handleLLMNewToken(message.result ?? "");
                    if (message.is_end) {
                        if (resolved || rejected) {
                            return;
                        }
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
                ...params,
                messages: messagesMapped,
            }, false, options?.signal).then((data) => {
                if (data?.error_code) {
                    throw new Error(data?.error_msg);
                }
                return data;
            });
        const { completion_tokens: completionTokens, prompt_tokens: promptTokens, total_tokens: totalTokens, } = data.usage ?? {};
        if (completionTokens) {
            tokenUsage.completionTokens =
                (tokenUsage.completionTokens ?? 0) + completionTokens;
        }
        if (promptTokens) {
            tokenUsage.promptTokens = (tokenUsage.promptTokens ?? 0) + promptTokens;
        }
        if (totalTokens) {
            tokenUsage.totalTokens = (tokenUsage.totalTokens ?? 0) + totalTokens;
        }
        const generations = [];
        const text = data.result ?? "";
        generations.push({
            text,
            message: new messages_1.AIMessage(text),
        });
        return {
            generations,
            llmOutput: { tokenUsage },
        };
    }
    /** @ignore */
    async completionWithRetry(request, stream, signal, onmessage) {
        // The first run will get the accessToken
        if (!this.accessToken) {
            this.accessToken = await this.getAccessToken();
        }
        const findFirstNewlineIndex = (data) => {
            for (let i = 0; i < data.length;) {
                if (data[i] === 10)
                    return i;
                if ((data[i] & 0b11100000) === 0b11000000) {
                    i += 2;
                }
                else if ((data[i] & 0b11110000) === 0b11100000) {
                    i += 3;
                }
                else if ((data[i] & 0b11111000) === 0b11110000) {
                    i += 4;
                }
                else {
                    i += 1;
                }
            }
            return -1;
        };
        const makeCompletionRequest = async () => {
            const url = `${this.apiUrl}?access_token=${this.accessToken}`;
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(request),
                signal,
            });
            if (!stream) {
                return response.json();
            }
            else {
                if (response.body) {
                    // response will not be a stream if an error occurred
                    if (!response.headers
                        .get("content-type")
                        ?.startsWith("text/event-stream")) {
                        onmessage?.(new MessageEvent("message", {
                            data: await response.text(),
                        }));
                        return;
                    }
                    const reader = response.body.getReader();
                    const decoder = new TextDecoder("utf-8");
                    let dataArrayBuffer = new Uint8Array(0);
                    let continueReading = true;
                    while (continueReading) {
                        const { done, value } = await reader.read();
                        if (done) {
                            continueReading = false;
                            break;
                        }
                        // merge the data first then decode in case of the Chinese characters are split between chunks
                        const mergedArray = new Uint8Array(dataArrayBuffer.length + value.length);
                        mergedArray.set(dataArrayBuffer);
                        mergedArray.set(value, dataArrayBuffer.length);
                        dataArrayBuffer = mergedArray;
                        let continueProcessing = true;
                        while (continueProcessing) {
                            const newlineIndex = findFirstNewlineIndex(dataArrayBuffer);
                            if (newlineIndex === -1) {
                                continueProcessing = false;
                                break;
                            }
                            const lineArrayBuffer = dataArrayBuffer.slice(0, findFirstNewlineIndex(dataArrayBuffer));
                            const line = decoder.decode(lineArrayBuffer);
                            dataArrayBuffer = dataArrayBuffer.slice(findFirstNewlineIndex(dataArrayBuffer) + 1);
                            if (line.startsWith("data:")) {
                                const event = new MessageEvent("message", {
                                    data: line.slice("data:".length).trim(),
                                });
                                onmessage?.(event);
                            }
                        }
                    }
                }
            }
        };
        return this.caller.call(makeCompletionRequest);
    }
    async getFullApiUrl() {
        if (!this.accessToken) {
            this.accessToken = await this.getAccessToken();
        }
        return `${this.apiUrl}?access_token=${this.accessToken}`;
    }
    async createWenxinStream(request, signal) {
        const url = await this.getFullApiUrl();
        const response = await fetch(url, {
            method: "POST",
            headers: {
                Accept: "text/event-stream",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(request),
            signal,
        });
        if (!response.body) {
            throw new Error("Could not begin Wenxin stream. Please check the given URL and try again.");
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
        // Wenxin requires the system message to be put in the params, not messages array
        const systemMessage = messages.find((message) => message._getType() === "system");
        if (systemMessage) {
            // eslint-disable-next-line no-param-reassign
            messages = messages.filter((message) => message !== systemMessage);
            parameters.system = systemMessage.text;
        }
        const messagesMapped = this._ensureMessages(messages);
        const stream = await this.caller.call(async () => this.createWenxinStream({
            ...parameters,
            messages: messagesMapped,
        }, options?.signal));
        for await (const chunk of stream) {
            const deserializedChunk = this._deserialize(chunk);
            const { result, is_end, id } = deserializedChunk;
            yield new outputs_1.ChatGenerationChunk({
                text: result,
                message: new messages_1.AIMessageChunk({ content: result }),
                generationInfo: is_end
                    ? {
                        is_end,
                        request_id: id,
                        usage: chunk.usage,
                    }
                    : undefined,
            });
            await runManager?.handleLLMNewToken(result);
        }
    }
    _llmType() {
        return "baiduwenxin";
    }
    /** @ignore */
    _combineLLMOutput() {
        return [];
    }
}
exports.ChatBaiduWenxin = ChatBaiduWenxin;
