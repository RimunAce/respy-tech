import { BaseListChatMessageHistory } from "@langchain/core/chat_history";
import { mapChatMessagesToStoredMessages, mapStoredMessagesToChatMessages, } from "@langchain/core/messages";
import * as cborg from "cborg";
import { Key } from "interface-datastore";
import all from "it-all";
export class IPFSDatastoreChatMessageHistory extends BaseListChatMessageHistory {
    constructor({ datastore, sessionId }) {
        super({ sessionId });
        Object.defineProperty(this, "lc_namespace", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ["langchain", "stores", "message", "datastore"]
        });
        Object.defineProperty(this, "sessionId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "datastore", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.datastore = datastore;
        this.sessionId = sessionId;
    }
    async getMessages() {
        const data = await all(this.datastore.query({ prefix: `/${this.sessionId}` }));
        const messages = data.map((d) => cborg.decode(d.value));
        return mapStoredMessagesToChatMessages(messages);
    }
    async addMessage(message) {
        await this.addMessages([message]);
    }
    async addMessages(messages) {
        const { length } = await all(this.datastore.queryKeys({ prefix: `/${this.sessionId}` }));
        const serializedMessages = mapChatMessagesToStoredMessages(messages);
        const pairs = serializedMessages.map((message, index) => ({
            key: new Key(`/${this.sessionId}/${index + length}`),
            value: cborg.encode(message),
        }));
        await all(this.datastore.putMany(pairs));
    }
    async clear() {
        const keys = this.datastore.queryKeys({ prefix: `/${this.sessionId}` });
        await all(this.datastore.deleteMany(keys));
    }
}
