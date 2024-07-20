"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZepCloudMemory = exports.zepMemoryToMessages = exports.condenseZepMemoryIntoHumanMessage = exports.zepMemoryContextToSystemPrompt = void 0;
const zep_cloud_1 = require("@getzep/zep-cloud");
const api_1 = require("@getzep/zep-cloud/api");
const memory_1 = require("@langchain/core/memory");
const messages_1 = require("@langchain/core/messages");
const chat_memory_js_1 = require("./chat_memory.cjs");
// Extract Summary and Facts from Zep memory, if present and compose a system prompt
const zepMemoryContextToSystemPrompt = (memory) => {
    let systemPrompt = "";
    // Extract conversation facts, if present
    if (memory.facts) {
        systemPrompt += memory.facts.join("\n");
    }
    // Extract summary, if present
    if (memory.summary && memory.summary?.content) {
        systemPrompt += memory.summary.content;
    }
    return systemPrompt;
};
exports.zepMemoryContextToSystemPrompt = zepMemoryContextToSystemPrompt;
// We are condensing the Zep context into a human message in order to satisfy
// some models' input requirements and allow more flexibility for devs.
// (for example, Anthropic only supports one system message, and does not support multiple user messages in a row)
const condenseZepMemoryIntoHumanMessage = (memory) => {
    const systemPrompt = (0, exports.zepMemoryContextToSystemPrompt)(memory);
    let concatMessages = "";
    // Add message history to the prompt, if present
    if (memory.messages) {
        concatMessages = memory.messages
            .map((msg) => `${msg.role ?? msg.roleType}: ${msg.content}`)
            .join("\n");
    }
    return new messages_1.HumanMessage(`${systemPrompt}\n${concatMessages}`);
};
exports.condenseZepMemoryIntoHumanMessage = condenseZepMemoryIntoHumanMessage;
// Convert Zep Memory to a list of BaseMessages
const zepMemoryToMessages = (memory) => {
    const systemPrompt = (0, exports.zepMemoryContextToSystemPrompt)(memory);
    let messages = systemPrompt
        ? [new messages_1.SystemMessage(systemPrompt)]
        : [];
    if (memory && memory.messages) {
        messages = messages.concat(memory.messages
            .filter((m) => m.content)
            .map((message) => {
            const { content, role, roleType } = message;
            const messageContent = content;
            if (roleType === "user") {
                return new messages_1.HumanMessage(messageContent);
            }
            else if (role === "assistant") {
                return new messages_1.AIMessage(messageContent);
            }
            else {
                // default to generic ChatMessage
                return new messages_1.ChatMessage(messageContent, (roleType ?? role));
            }
        }));
    }
    return messages;
};
exports.zepMemoryToMessages = zepMemoryToMessages;
/**
 * Class used to manage the memory of a chat session, including loading
 * and saving the chat history, and clearing the memory when needed. It
 * uses the ZepClient to interact with the Zep service for managing the
 * chat session's memory.
 * @example
 * ```typescript
 * const sessionId = randomUUID();
 *
 * // Initialize ZepCloudMemory with session ID and API key
 * const memory = new ZepCloudMemory({
 *   sessionId,
 *   apiKey: "<zep api key>",
 * });
 *
 * // Create a ChatOpenAI model instance with specific parameters
 * const model = new ChatOpenAI({
 *   modelName: "gpt-3.5-turbo",
 *   temperature: 0,
 * });
 *
 * // Create a ConversationChain with the model and memory
 * const chain = new ConversationChain({ llm: model, memory });
 *
 * // Example of calling the chain with an input
 * const res1 = await chain.call({ input: "Hi! I'm Jim." });
 * console.log({ res1 });
 *
 * // Follow-up call to the chain to demonstrate memory usage
 * const res2 = await chain.call({ input: "What did I just say my name was?" });
 * console.log({ res2 });
 *
 * // Output the session ID and the current state of memory
 * console.log("Session ID: ", sessionId);
 * console.log("Memory: ", await memory.loadMemoryVariables({}));
 *
 * ```
 */
class ZepCloudMemory extends chat_memory_js_1.BaseChatMemory {
    constructor(fields) {
        super({
            returnMessages: fields?.returnMessages ?? false,
            inputKey: fields?.inputKey,
            outputKey: fields?.outputKey,
        });
        Object.defineProperty(this, "humanPrefix", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "Human"
        });
        Object.defineProperty(this, "aiPrefix", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "AI"
        });
        Object.defineProperty(this, "memoryKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "history"
        });
        Object.defineProperty(this, "apiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "sessionId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "zepClient", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "memoryType", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "separateMessages", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.humanPrefix = fields.humanPrefix ?? this.humanPrefix;
        this.aiPrefix = fields.aiPrefix ?? this.aiPrefix;
        this.memoryKey = fields.memoryKey ?? this.memoryKey;
        this.apiKey = fields.apiKey;
        this.sessionId = fields.sessionId;
        this.memoryType = fields.memoryType ?? "perpetual";
        this.separateMessages = fields.separateMessages ?? false;
        this.zepClient = new zep_cloud_1.ZepClient({
            apiKey: this.apiKey,
        });
    }
    get memoryKeys() {
        return [this.memoryKey];
    }
    /**
     * Method that retrieves the chat history from the Zep service and formats
     * it into a list of messages.
     * @param values Input values for the method.
     * @returns Promise that resolves with the chat history formatted into a list of messages.
     */
    async loadMemoryVariables(values) {
        const memoryType = values.memoryType ?? "perpetual";
        let memory = null;
        try {
            memory = await this.zepClient.memory.get(this.sessionId, {
                memoryType,
            });
        }
        catch (error) {
            // eslint-disable-next-line no-instanceof/no-instanceof
            if (error instanceof api_1.NotFoundError) {
                return this.returnMessages
                    ? { [this.memoryKey]: [] }
                    : { [this.memoryKey]: "" };
            }
            throw error;
        }
        if (this.returnMessages) {
            return {
                [this.memoryKey]: this.separateMessages
                    ? (0, exports.zepMemoryToMessages)(memory)
                    : [(0, exports.condenseZepMemoryIntoHumanMessage)(memory)],
            };
        }
        return {
            [this.memoryKey]: this.separateMessages
                ? (0, messages_1.getBufferString)((0, exports.zepMemoryToMessages)(memory), this.humanPrefix, this.aiPrefix)
                : (0, exports.condenseZepMemoryIntoHumanMessage)(memory).content,
        };
    }
    /**
     * Method that saves the input and output messages to the Zep service.
     * @param inputValues Input messages to be saved.
     * @param outputValues Output messages to be saved.
     * @returns Promise that resolves when the messages have been saved.
     */
    async saveContext(inputValues, outputValues) {
        const input = (0, memory_1.getInputValue)(inputValues, this.inputKey);
        const output = (0, memory_1.getOutputValue)(outputValues, this.outputKey);
        // Add the new memory to the session using the ZepClient
        if (this.sessionId) {
            try {
                await this.zepClient.memory.add(this.sessionId, {
                    messages: [
                        {
                            role: this.humanPrefix,
                            roleType: "user",
                            content: `${input}`,
                        },
                        {
                            role: this.aiPrefix,
                            roleType: "assistant",
                            content: `${output}`,
                        },
                    ],
                });
            }
            catch (error) {
                console.error("Error adding memory: ", error);
            }
        }
        // Call the superclass's saveContext method
        await super.saveContext(inputValues, outputValues);
    }
    /**
     * Method that deletes the chat history from the Zep service.
     * @returns Promise that resolves when the chat history has been deleted.
     */
    async clear() {
        try {
            await this.zepClient.memory.delete(this.sessionId);
        }
        catch (error) {
            console.error("Error deleting session: ", error);
        }
        // Clear the superclass's chat history
        await super.clear();
    }
}
exports.ZepCloudMemory = ZepCloudMemory;
