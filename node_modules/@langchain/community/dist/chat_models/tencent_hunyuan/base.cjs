"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatTencentHunyuan = void 0;
const chat_models_1 = require("@langchain/core/language_models/chat_models");
const messages_1 = require("@langchain/core/messages");
const outputs_1 = require("@langchain/core/outputs");
const env_1 = require("@langchain/core/utils/env");
const stream_1 = require("@langchain/core/utils/stream");
/**
 * Function that converts a base message to a Hunyuan message role.
 * @param message Base message to convert.
 * @returns The Hunyuan message role.
 */
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
            throw new Error("Function messages not supported");
        case "generic": {
            if (!messages_1.ChatMessage.isInstance(message)) {
                throw new Error("Invalid generic chat message");
            }
            if (["system", "assistant", "user"].includes(message.role)) {
                return message.role;
            }
            throw new Error(`Unknown message role: ${message.role}`);
        }
        default:
            throw new Error(`Unknown message type: ${type}`);
    }
}
/**
 * Wrapper around Tencent Hunyuan large language models that use the Chat endpoint.
 *
 * To use you should have the `TENCENT_SECRET_ID` and `TENCENT_SECRET_KEY`
 * environment variable set.
 *
 * @augments BaseLLM
 * @augments TencentHunyuanInput
 * @example
 * ```typescript
 * const messages = [new HumanMessage("Hello")];
 *
 * const hunyuanLite = new ChatTencentHunyuan({
 *   model: "hunyuan-lite",
 *   tencentSecretId: "YOUR-SECRET-ID",
 *   tencentSecretKey: "YOUR-SECRET-KEY",
 * });
 *
 * let res = await hunyuanLite.call(messages);
 *
 * const hunyuanPro = new ChatTencentHunyuan({
 *   model: "hunyuan-pro",
 *   temperature: 1,
 *   tencentSecretId: "YOUR-SECRET-ID",
 *   tencentSecretKey: "YOUR-SECRET-KEY",
 * });
 *
 * res = await hunyuanPro.call(messages);
 * ```
 */
class ChatTencentHunyuan extends chat_models_1.BaseChatModel {
    static lc_name() {
        return "ChatTencentHunyuan";
    }
    get callKeys() {
        return ["stop", "signal", "options"];
    }
    get lc_secrets() {
        return {
            tencentSecretId: "TENCENT_SECRET_ID",
            tencentSecretKey: "TENCENT_SECRET_KEY",
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
        Object.defineProperty(this, "tencentSecretId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "tencentSecretKey", {
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
        Object.defineProperty(this, "host", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "hunyuan.tencentcloudapi.com"
        });
        Object.defineProperty(this, "model", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "hunyuan-pro"
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
        Object.defineProperty(this, "sign", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.tencentSecretId =
            fields?.tencentSecretId ?? (0, env_1.getEnvironmentVariable)("TENCENT_SECRET_ID");
        if (!this.tencentSecretId) {
            throw new Error("Tencent SecretID not found");
        }
        this.tencentSecretKey =
            fields?.tencentSecretKey ?? (0, env_1.getEnvironmentVariable)("TENCENT_SECRET_KEY");
        if (!this.tencentSecretKey) {
            throw new Error("Tencent SecretKey not found");
        }
        this.host = fields?.host ?? this.host;
        this.topP = fields?.topP ?? this.topP;
        this.model = fields?.model ?? this.model;
        this.streaming = fields?.streaming ?? this.streaming;
        this.temperature = fields?.temperature ?? this.temperature;
        if (!fields?.sign) {
            throw new Error("Sign method undefined");
        }
        this.sign = fields?.sign;
    }
    /**
     * Get the parameters used to invoke the model
     */
    invocationParams() {
        return {
            TopP: this.topP,
            Model: this.model,
            Stream: this.streaming,
            Temperature: this.temperature,
        };
    }
    /**
     * Get the HTTP headers used to invoke the model
     */
    invocationHeaders(request, timestamp) {
        const headers = {
            "Content-Type": "application/json",
            "X-TC-Action": "ChatCompletions",
            "X-TC-Version": "2023-09-01",
            "X-TC-Timestamp": timestamp.toString(),
            Authorization: "",
        };
        headers.Authorization = this.sign(this.host, request, timestamp, this.tencentSecretId ?? "", this.tencentSecretKey ?? "", headers);
        return headers;
    }
    async *_streamResponseChunks(messages, options, runManager) {
        const stream = await this.caller.call(async () => this.createStream({
            ...this.invocationParams(),
            Messages: messages.map((message) => ({
                Role: messageToRole(message),
                Content: message.content,
            })),
        }, options?.signal));
        for await (const chunk of stream) {
            // handle streaming error
            if (chunk.ErrorMsg?.Message) {
                throw new Error(`[${chunk.Id}] ${chunk.ErrorMsg?.Message}`);
            }
            const { Choices: [{ Delta: { Content }, FinishReason, },], } = chunk;
            yield new outputs_1.ChatGenerationChunk({
                text: Content,
                message: new messages_1.AIMessageChunk({ content: Content }),
                generationInfo: FinishReason
                    ? {
                        usage: chunk.Usage,
                        request_id: chunk.Id,
                        finish_reason: FinishReason,
                    }
                    : undefined,
            });
            await runManager?.handleLLMNewToken(Content);
        }
    }
    async *createStream(request, signal) {
        const timestamp = Math.trunc(Date.now() / 1000);
        const headers = this.invocationHeaders(request, timestamp);
        const response = await fetch(`https://${this.host}`, {
            headers,
            method: "POST",
            body: JSON.stringify(request),
            signal,
        });
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Hunyuan call failed with status code ${response.status}: ${text}`);
        }
        if (!response.headers.get("content-type")?.startsWith("text/event-stream")) {
            const text = await response.text();
            try {
                const data = JSON.parse(text);
                if (data?.Response?.Error?.Message) {
                    throw new Error(`[${data?.Response?.RequestId}] ${data?.Response?.Error?.Message}`);
                }
            }
            catch (e) {
                throw new Error(`Could not begin Hunyuan stream, received a non-JSON parseable response: ${text}.`);
            }
        }
        if (!response.body) {
            throw new Error(`Could not begin Hunyuan stream, received empty body response.`);
        }
        const decoder = new TextDecoder("utf-8");
        const stream = stream_1.IterableReadableStream.fromReadableStream(response.body);
        let extra = "";
        for await (const chunk of stream) {
            const decoded = extra + decoder.decode(chunk);
            const lines = decoded.split("\n");
            extra = lines.pop() || "";
            for (const line of lines) {
                if (!line.startsWith("data:")) {
                    continue;
                }
                try {
                    yield JSON.parse(line.slice("data:".length).trim());
                }
                catch (e) {
                    console.warn(`Received a non-JSON parseable chunk: ${line}`);
                }
            }
        }
    }
    /** @ignore */
    async _generate(messages, options, runManager) {
        const params = this.invocationParams();
        if (params.Stream) {
            let usage = {};
            const stream = this._streamResponseChunks(messages, options ?? {}, runManager);
            const generations = [];
            for await (const chunk of stream) {
                const text = chunk.text ?? "";
                generations.push({
                    text,
                    message: new messages_1.AIMessage(text),
                });
                usage = chunk.generationInfo?.usage;
            }
            return {
                generations,
                llmOutput: {
                    tokenUsage: {
                        totalTokens: usage.TotalTokens,
                        promptTokens: usage.PromptTokens,
                        completionTokens: usage.CompletionTokens,
                    },
                },
            };
        }
        const data = await this.completionWithRetry({
            ...params,
            Messages: messages.map((message) => ({
                Role: messageToRole(message),
                Content: message.content,
            })),
        }, options?.signal).then((data) => {
            const response = data?.Response;
            if (response?.Error?.Message) {
                throw new Error(`[${response.RequestId}] ${response.Error.Message}`);
            }
            return response;
        });
        const text = data.Choices[0]?.Message?.Content ?? "";
        const { TotalTokens = 0, PromptTokens = 0, CompletionTokens = 0, } = data.Usage;
        return {
            generations: [
                {
                    text,
                    message: new messages_1.AIMessage(text),
                },
            ],
            llmOutput: {
                tokenUsage: {
                    totalTokens: TotalTokens,
                    promptTokens: PromptTokens,
                    completionTokens: CompletionTokens,
                },
            },
        };
    }
    /** @ignore */
    async completionWithRetry(request, signal) {
        return this.caller.call(async () => {
            const timestamp = Math.trunc(Date.now() / 1000);
            const headers = this.invocationHeaders(request, timestamp);
            const response = await fetch(`https://${this.host}`, {
                headers,
                method: "POST",
                body: JSON.stringify(request),
                signal,
            });
            return response.json();
        });
    }
    _llmType() {
        return "tencenthunyuan";
    }
    /** @ignore */
    _combineLLMOutput() {
        return [];
    }
}
exports.ChatTencentHunyuan = ChatTencentHunyuan;
