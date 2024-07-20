"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatWebLLM = void 0;
const chat_models_1 = require("@langchain/core/language_models/chat_models");
const messages_1 = require("@langchain/core/messages");
const outputs_1 = require("@langchain/core/outputs");
const webllm = __importStar(require("@mlc-ai/web-llm"));
/**
 * To use this model you need to have the `@mlc-ai/web-llm` module installed.
 * This can be installed using `npm install -S @mlc-ai/web-llm`.
 *
 * You can see a list of available model records here:
 * https://github.com/mlc-ai/web-llm/blob/main/src/config.ts
 * @example
 * ```typescript
 * // Initialize the ChatWebLLM model with the model record.
 * const model = new ChatWebLLM({
 *   model: "Phi-3-mini-4k-instruct-q4f16_1-MLC",
 *   chatOptions: {
 *     temperature: 0.5,
 *   },
 * });
 *
 * // Call the model with a message and await the response.
 * const response = await model.invoke([
 *   new HumanMessage({ content: "My name is John." }),
 * ]);
 * ```
 */
class ChatWebLLM extends chat_models_1.SimpleChatModel {
    static lc_name() {
        return "ChatWebLLM";
    }
    constructor(inputs) {
        super(inputs);
        Object.defineProperty(this, "engine", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "appConfig", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "chatOptions", {
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
        Object.defineProperty(this, "model", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.appConfig = inputs.appConfig;
        this.chatOptions = inputs.chatOptions;
        this.model = inputs.model;
        this.temperature = inputs.temperature;
        this.engine = new webllm.MLCEngine({
            appConfig: this.appConfig,
        });
    }
    _llmType() {
        return "web-llm";
    }
    async initialize(progressCallback) {
        if (progressCallback !== undefined) {
            this.engine.setInitProgressCallback(progressCallback);
        }
        await this.reload(this.model, this.chatOptions);
    }
    async reload(modelId, newChatOpts) {
        await this.engine.reload(modelId, newChatOpts);
    }
    async *_streamResponseChunks(messages, options, runManager) {
        const messagesInput = messages.map((message) => {
            if (typeof message.content !== "string") {
                throw new Error("ChatWebLLM does not support non-string message content in sessions.");
            }
            const langChainType = message._getType();
            let role;
            if (langChainType === "ai") {
                role = "assistant";
            }
            else if (langChainType === "human") {
                role = "user";
            }
            else if (langChainType === "system") {
                role = "system";
            }
            else {
                throw new Error("Function, tool, and generic messages are not supported.");
            }
            return {
                role,
                content: message.content,
            };
        });
        const stream = await this.engine.chat.completions.create({
            stream: true,
            messages: messagesInput,
            stop: options.stop,
            logprobs: true,
        });
        for await (const chunk of stream) {
            // Last chunk has undefined content
            const text = chunk.choices[0].delta.content ?? "";
            yield new outputs_1.ChatGenerationChunk({
                text,
                message: new messages_1.AIMessageChunk({
                    content: text,
                    additional_kwargs: {
                        logprobs: chunk.choices[0].logprobs,
                        finish_reason: chunk.choices[0].finish_reason,
                    },
                }),
            });
            await runManager?.handleLLMNewToken(text);
        }
    }
    async _call(messages, options, runManager) {
        const chunks = [];
        for await (const chunk of this._streamResponseChunks(messages, options, runManager)) {
            chunks.push(chunk.text);
        }
        return chunks.join("");
    }
}
exports.ChatWebLLM = ChatWebLLM;
