"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PremEmbeddings = void 0;
const env_1 = require("@langchain/core/utils/env");
const embeddings_1 = require("@langchain/core/embeddings");
const chunk_array_1 = require("@langchain/core/utils/chunk_array");
const prem_sdk_1 = __importDefault(require("@premai/prem-sdk"));
/**
 * Class for generating embeddings using the Prem AI's API. Extends the
 * Embeddings class and implements PremEmbeddingsParams and
 */
class PremEmbeddings extends embeddings_1.Embeddings {
    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "client", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "batchSize", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 128
        });
        Object.defineProperty(this, "apiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "project_id", {
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
        Object.defineProperty(this, "encoding_format", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        const apiKey = fields?.apiKey || (0, env_1.getEnvironmentVariable)("PREM_API_KEY");
        if (!apiKey) {
            throw new Error(`Prem API key not found. Please set the PREM_API_KEY environment variable or provide the key into "apiKey"`);
        }
        const projectId = fields?.project_id ??
            parseInt((0, env_1.getEnvironmentVariable)("PREM_PROJECT_ID") ?? "-1", 10);
        if (!projectId || projectId === -1 || typeof projectId !== "number") {
            throw new Error(`Prem project ID not found. Please set the PREM_PROJECT_ID environment variable or provide the key into "project_id"`);
        }
        this.client = new prem_sdk_1.default({
            apiKey,
        });
        this.project_id = projectId;
        this.model = fields.model ?? this.model;
        this.encoding_format = fields.encoding_format ?? this.encoding_format;
    }
    /**
     * Method to generate embeddings for an array of documents. Splits the
     * documents into batches and makes requests to the Prem API to generate
     * embeddings.
     * @param texts Array of documents to generate embeddings for.
     * @returns Promise that resolves to a 2D array of embeddings for each document.
     */
    async embedDocuments(texts) {
        const mappedTexts = texts.map((text) => text);
        const batches = (0, chunk_array_1.chunkArray)(mappedTexts, this.batchSize);
        const batchRequests = batches.map((batch) => this.caller.call(async () => this.client.embeddings.create({
            input: batch,
            model: this.model,
            encoding_format: this.encoding_format,
            project_id: this.project_id,
        })));
        const batchResponses = await Promise.all(batchRequests);
        const embeddings = [];
        for (let i = 0; i < batchResponses.length; i += 1) {
            const batch = batches[i];
            const { data: batchResponse } = batchResponses[i];
            for (let j = 0; j < batch.length; j += 1) {
                embeddings.push(batchResponse[j].embedding);
            }
        }
        return embeddings;
    }
    /**
     * Method to generate an embedding for a single document. Calls the
     * embedDocuments method with the document as the input.
     * @param text Document to generate an embedding for.
     * @returns Promise that resolves to an embedding for the document.
     */
    async embedQuery(text) {
        const data = await this.embedDocuments([text]);
        return data[0];
    }
}
exports.PremEmbeddings = PremEmbeddings;
