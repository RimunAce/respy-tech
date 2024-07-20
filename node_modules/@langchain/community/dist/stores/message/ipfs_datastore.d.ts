import { BaseListChatMessageHistory } from "@langchain/core/chat_history";
import { type BaseMessage } from "@langchain/core/messages";
import { type Datastore } from "interface-datastore";
export interface IPFSDatastoreChatMessageHistoryInput {
    sessionId: string;
}
export interface IPFSDatastoreChatMessageHistoryProps {
    datastore: Datastore;
    sessionId: string;
}
export declare class IPFSDatastoreChatMessageHistory extends BaseListChatMessageHistory {
    readonly lc_namespace: string[];
    readonly sessionId: string;
    private readonly datastore;
    constructor({ datastore, sessionId }: IPFSDatastoreChatMessageHistoryProps);
    getMessages(): Promise<BaseMessage[]>;
    addMessage(message: BaseMessage): Promise<void>;
    addMessages(messages: BaseMessage[]): Promise<void>;
    clear(): Promise<void>;
}
