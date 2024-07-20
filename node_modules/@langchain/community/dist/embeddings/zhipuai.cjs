"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZhipuAIEmbeddings = void 0;
const env_1 = require("@langchain/core/utils/env");
const embeddings_1 = require("@langchain/core/embeddings");
const zhipuai_js_1 = require("../utils/zhipuai.cjs");
class ZhipuAIEmbeddings extends embeddings_1.Embeddings {
    constructor(fields) {
        super(fields ?? {});
        Object.defineProperty(this, "modelName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "embedding-2"
        });
        Object.defineProperty(this, "apiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "stripNewLines", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
        Object.defineProperty(this, "embeddingsAPIURL", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "https://open.bigmodel.cn/api/paas/v4/embeddings"
        });
        this.modelName = fields?.modelName ?? this.modelName;
        this.stripNewLines = fields?.stripNewLines ?? this.stripNewLines;
        this.apiKey = fields?.apiKey ?? (0, env_1.getEnvironmentVariable)("ZHIPUAI_API_KEY");
        if (!this.apiKey) {
            throw new Error("ZhipuAI API key not found");
        }
    }
    /**
     * Private method to make a request to the TogetherAI API to generate
     * embeddings. Handles the retry logic and returns the response from the API.
     * @param {string} input The input text to embed.
     * @returns Promise that resolves to the response from the API.
     * @TODO Figure out return type and statically type it.
     */
    async embeddingWithRetry(input) {
        const text = this.stripNewLines ? input.replace(/\n/g, " ") : input;
        const body = JSON.stringify({ input: text, model: this.modelName });
        const headers = {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: (0, zhipuai_js_1.encodeApiKey)(this.apiKey),
        };
        return this.caller.call(async () => {
            const fetchResponse = await fetch(this.embeddingsAPIURL, {
                method: "POST",
                headers,
                body,
            });
            if (fetchResponse.status === 200) {
                return fetchResponse.json();
            }
            throw new Error(`Error getting embeddings from ZhipuAI. ${JSON.stringify(await fetchResponse.json(), null, 2)}`);
        });
    }
    /**
     * Method to generate an embedding for a single document. Calls the
     * embeddingWithRetry method with the document as the input.
     * @param {string} text Document to generate an embedding for.
     * @returns {Promise<number[]>} Promise that resolves to an embedding for the document.
     */
    async embedQuery(text) {
        const { data } = await this.embeddingWithRetry(text);
        return data[0].embedding;
    }
    /**
     * Method that takes an array of documents as input and returns a promise
     * that resolves to a 2D array of embeddings for each document. It calls
     * the embedQuery method for each document in the array.
     * @param documents Array of documents for which to generate embeddings.
     * @returns Promise that resolves to a 2D array of embeddings for each input document.
     */
    embedDocuments(documents) {
        return Promise.all(documents.map((doc) => this.embedQuery(doc)));
    }
}
exports.ZhipuAIEmbeddings = ZhipuAIEmbeddings;
