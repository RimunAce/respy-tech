"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZepCloudRetriever = void 0;
const zep_cloud_1 = require("@getzep/zep-cloud");
const api_1 = require("@getzep/zep-cloud/api");
const retrievers_1 = require("@langchain/core/retrievers");
const documents_1 = require("@langchain/core/documents");
/**
 * Class for retrieving information from a Zep Cloud long-term memory store.
 * Extends the BaseRetriever class.
 * @example
 * ```typescript
 * const retriever = new ZepCloudRetriever({
 *   apiKey: "<zep cloud project api key>",
 *   sessionId: "session_exampleUUID",
 *   topK: 3,
 * });
 * const query = "Can I drive red cars in France?";
 * const docs = await retriever.getRelevantDocuments(query);
 * ```
 */
class ZepCloudRetriever extends retrievers_1.BaseRetriever {
    static lc_name() {
        return "ZepRetriever";
    }
    get lc_secrets() {
        return {
            apiKey: "ZEP_API_KEY",
        };
    }
    get lc_aliases() {
        return { apiKey: "api_key" };
    }
    constructor(config) {
        super(config);
        Object.defineProperty(this, "lc_namespace", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ["langchain", "retrievers", "zep"]
        });
        Object.defineProperty(this, "client", {
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
        Object.defineProperty(this, "topK", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "searchScope", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "searchType", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "mmrLambda", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "filter", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.sessionId = config.sessionId;
        this.topK = config.topK;
        this.searchScope = config.searchScope;
        this.searchType = config.searchType;
        this.mmrLambda = config.mmrLambda;
        this.filter = config.filter;
        this.client = new zep_cloud_1.ZepClient({ apiKey: config.apiKey });
    }
    /**
     *  Converts an array of message search results to an array of Document objects.
     *  @param {MemorySearchResult[]} results - The array of search results.
     *  @returns {Document[]} An array of Document objects representing the search results.
     */
    searchMessageResultToDoc(results) {
        return results
            .filter((r) => r.message)
            .map(({ message: { content, metadata: messageMetadata } = {}, score, ...rest }) => new documents_1.Document({
            pageContent: content ?? "",
            metadata: { score, ...messageMetadata, ...rest },
        }));
    }
    /**
     *  Converts an array of summary search results to an array of Document objects.
     *  @param {MemorySearchResult[]} results - The array of search results.
     *  @returns {Document[]} An array of Document objects representing the search results.
     */
    searchSummaryResultToDoc(results) {
        return results
            .filter((r) => r.summary)
            .map(({ summary: { content, metadata: summaryMetadata } = {}, score, ...rest }) => new documents_1.Document({
            pageContent: content ?? "",
            metadata: { score, ...summaryMetadata, ...rest },
        }));
    }
    /**
     *  Retrieves the relevant documents based on the given query.
     *  @param {string} query - The query string.
     *  @returns {Promise<Document[]>} A promise that resolves to an array of relevant Document objects.
     */
    async _getRelevantDocuments(query) {
        try {
            const results = await this.client.memory.search(this.sessionId, {
                text: query,
                metadata: this.filter,
                searchScope: this.searchScope,
                searchType: this.searchType,
                mmrLambda: this.mmrLambda,
                limit: this.topK,
            });
            return this.searchScope === "summary"
                ? this.searchSummaryResultToDoc(results)
                : this.searchMessageResultToDoc(results);
        }
        catch (error) {
            // eslint-disable-next-line no-instanceof/no-instanceof
            if (error instanceof api_1.NotFoundError) {
                return Promise.resolve([]); // Return an empty Document array
            }
            // If it's not a NotFoundError, throw the error again
            throw error;
        }
    }
}
exports.ZepCloudRetriever = ZepCloudRetriever;
