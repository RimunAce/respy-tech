import { Zep, ZepClient } from "@getzep/zep-cloud";
import { RoleType } from "@getzep/zep-cloud/api";
import { BaseChatMessageHistory } from "@langchain/core/chat_history";
import { BaseMessage, MessageType } from "@langchain/core/messages";
export declare const getZepMessageRoleType: (role: MessageType) => RoleType;
/**
 * Interface defining the structure of the input data for the ZepMemory
 * class. It includes properties like humanPrefix, aiPrefix, memoryKey, sessionId, memoryType and apiKey.
 */
interface ZepMemoryInput {
    sessionId: string;
    client: ZepClient;
    memoryType: Zep.MemoryType;
    humanPrefix?: string;
    aiPrefix?: string;
    separateMessages?: boolean;
}
/**
 * Class used to manage the memory of a chat session, including loading
 * and saving the chat history, and clearing the memory when needed. It
 * uses the ZepClient to interact with the Zep service for managing the
 * chat session's memory.
 *
 */
export declare class ZepCloudChatMessageHistory extends BaseChatMessageHistory implements ZepMemoryInput {
    lc_namespace: string[];
    sessionId: string;
    client: ZepClient;
    memoryType: Zep.MemoryType;
    humanPrefix: string;
    aiPrefix: string;
    separateMessages: boolean;
    constructor(fields: ZepMemoryInput);
    private getMemory;
    getMessages(): Promise<BaseMessage[]>;
    addAIChatMessage(message: string, metadata?: Record<string, unknown>): Promise<void>;
    addMessage(message: BaseMessage, metadata?: Record<string, unknown>): Promise<void>;
    addUserMessage(message: string, metadata?: Record<string, unknown>): Promise<void>;
    clear(): Promise<void>;
}
export {};
