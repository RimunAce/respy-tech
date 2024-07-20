import { Zep, ZepClient } from "@getzep/zep-cloud";
import { Memory } from "@getzep/zep-cloud/api";
import { InputValues, OutputValues, MemoryVariables } from "@langchain/core/memory";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import { BaseChatMemory, BaseChatMemoryInput } from "./chat_memory.js";
export declare const zepMemoryContextToSystemPrompt: (memory: Memory) => string;
export declare const condenseZepMemoryIntoHumanMessage: (memory: Memory) => HumanMessage;
export declare const zepMemoryToMessages: (memory: Memory) => BaseMessage[];
/**
 * Interface defining the structure of the input data for the ZepMemory
 * class. It includes properties like humanPrefix, aiPrefix, memoryKey, memoryType
 * sessionId, and apiKey.
 */
export interface ZepCloudMemoryInput extends BaseChatMemoryInput {
    humanPrefix?: string;
    aiPrefix?: string;
    memoryKey?: string;
    sessionId: string;
    apiKey: string;
    memoryType?: Zep.MemoryType;
    separateMessages?: boolean;
}
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
export declare class ZepCloudMemory extends BaseChatMemory implements ZepCloudMemoryInput {
    humanPrefix: string;
    aiPrefix: string;
    memoryKey: string;
    apiKey: string;
    sessionId: string;
    zepClient: ZepClient;
    memoryType: Zep.MemoryType;
    separateMessages: boolean;
    constructor(fields: ZepCloudMemoryInput);
    get memoryKeys(): string[];
    /**
     * Method that retrieves the chat history from the Zep service and formats
     * it into a list of messages.
     * @param values Input values for the method.
     * @returns Promise that resolves with the chat history formatted into a list of messages.
     */
    loadMemoryVariables(values: InputValues): Promise<MemoryVariables>;
    /**
     * Method that saves the input and output messages to the Zep service.
     * @param inputValues Input messages to be saved.
     * @param outputValues Output messages to be saved.
     * @returns Promise that resolves when the messages have been saved.
     */
    saveContext(inputValues: InputValues, outputValues: OutputValues): Promise<void>;
    /**
     * Method that deletes the chat history from the Zep service.
     * @returns Promise that resolves when the chat history has been deleted.
     */
    clear(): Promise<void>;
}
