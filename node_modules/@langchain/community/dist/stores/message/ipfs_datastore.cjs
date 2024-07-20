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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPFSDatastoreChatMessageHistory = void 0;
const chat_history_1 = require("@langchain/core/chat_history");
const messages_1 = require("@langchain/core/messages");
const cborg = __importStar(require("cborg"));
const interface_datastore_1 = require("interface-datastore");
const it_all_1 = __importDefault(require("it-all"));
class IPFSDatastoreChatMessageHistory extends chat_history_1.BaseListChatMessageHistory {
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
        const data = await (0, it_all_1.default)(this.datastore.query({ prefix: `/${this.sessionId}` }));
        const messages = data.map((d) => cborg.decode(d.value));
        return (0, messages_1.mapStoredMessagesToChatMessages)(messages);
    }
    async addMessage(message) {
        await this.addMessages([message]);
    }
    async addMessages(messages) {
        const { length } = await (0, it_all_1.default)(this.datastore.queryKeys({ prefix: `/${this.sessionId}` }));
        const serializedMessages = (0, messages_1.mapChatMessagesToStoredMessages)(messages);
        const pairs = serializedMessages.map((message, index) => ({
            key: new interface_datastore_1.Key(`/${this.sessionId}/${index + length}`),
            value: cborg.encode(message),
        }));
        await (0, it_all_1.default)(this.datastore.putMany(pairs));
    }
    async clear() {
        const keys = this.datastore.queryKeys({ prefix: `/${this.sessionId}` });
        await (0, it_all_1.default)(this.datastore.deleteMany(keys));
    }
}
exports.IPFSDatastoreChatMessageHistory = IPFSDatastoreChatMessageHistory;
