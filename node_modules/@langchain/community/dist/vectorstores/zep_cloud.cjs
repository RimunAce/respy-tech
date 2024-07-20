"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZepCloudVectorStore = void 0;
/* eslint-disable @typescript-eslint/no-non-null-assertion */
const zep_cloud_1 = require("@getzep/zep-cloud");
const api_1 = require("@getzep/zep-cloud/api");
const vectorstores_1 = require("@langchain/core/vectorstores");
const documents_1 = require("@langchain/core/documents");
const math_1 = require("@langchain/core/utils/math");
const testing_1 = require("@langchain/core/utils/testing");
function zepDocsToDocumentsAndScore(results) {
    return results.map((d) => [
        new documents_1.Document({
            pageContent: d.content ?? "",
            metadata: d.metadata,
        }),
        d.score ? d.score : 0,
    ]);
}
function assignMetadata(value) {
    if (typeof value === "object" && value !== null) {
        return value;
    }
    if (value !== undefined) {
        console.warn("Metadata filters must be an object, Record, or undefined.");
    }
    return undefined;
}
/**
 * ZepCloudVectorStore is a VectorStore implementation
 * that uses the Zep long-term memory store as a backend.
 *
 * If the collection does not exist, it will be created automatically.
 *
 * Requires `@getzep/zep-cloud` to be installed:
 *
 *
 * @property {ZepClient} client - The ZepClient instance used to interact with Zep's API.
 * @property {Promise<void>} initPromise - A promise that resolves
 * when the collection is initialized.
 */
class ZepCloudVectorStore extends vectorstores_1.VectorStore {
    constructor(embeddings, args) {
        super(embeddings, args);
        Object.defineProperty(this, "client", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "collectionName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "initPromise", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.initPromise = this.initCollection(args).catch((err) => {
            console.error("Error initializing collection:", err);
            throw err;
        });
    }
    /**
     * Initializes the document collection. If the collection does not exist, it creates a new one.
     *
     * @param {IZepConfig} args - The configuration object for the Zep API.
     */
    async initCollection(args) {
        if (args.client) {
            this.client = args.client;
        }
        else {
            this.client = new zep_cloud_1.ZepClient({
                apiKey: args.apiKey,
            });
        }
        try {
            this.collectionName = args.collectionName;
            await this.client.document.getCollection(this.collectionName);
        }
        catch (err) {
            // eslint-disable-next-line no-instanceof/no-instanceof
            if (err instanceof Error) {
                // eslint-disable-next-line no-instanceof/no-instanceof
                if (err instanceof api_1.NotFoundError || err.name === "NotFoundError") {
                    await this.createCollection(args);
                }
                else {
                    throw err;
                }
            }
        }
    }
    /**
     * Creates a new document collection.
     *
     * @param {IZepConfig} args - The configuration object for the Zep API.
     */
    async createCollection(args) {
        await this.client.document.addCollection(args.collectionName, {
            description: args.description,
            metadata: args.metadata,
        });
    }
    async addVectors() {
        throw new Error("Adding vectors is not supported in Zep Cloud.");
    }
    /**
     * Adds documents to the collection. The documents are first embedded into vectors
     * using the provided embedding model.
     *
     * @param {Document[]} documents - The documents to add.
     * @returns {Promise<string[]>} - A promise that resolves with the UUIDs of the added documents.
     */
    async addDocuments(documents) {
        const docs = [];
        for (let i = 0; i < documents.length; i += 1) {
            const doc = {
                content: documents[i].pageContent,
                metadata: documents[i].metadata,
            };
            docs.push(doc);
        }
        // Wait for collection to be initialized
        await this.initPromise;
        return this.client.document.addDocuments(this.collectionName, docs);
    }
    // eslint-disable-next-line class-methods-use-this,no-underscore-dangle
    _vectorstoreType() {
        return "zep";
    }
    /**
     * Deletes documents from the collection.
     *
     * @param {IZepDeleteParams} params - The list of Zep document UUIDs to delete.
     * @returns {Promise<void>}
     */
    async delete(params) {
        // Wait for collection to be initialized
        await this.initPromise;
        // eslint-disable-next-line no-restricted-syntax
        for await (const uuid of params.uuids) {
            await this.client.document.deleteDocument(this.collectionName, uuid);
        }
    }
    async similaritySearchVectorWithScore() {
        throw new Error("Unsupported in Zep Cloud.");
    }
    // eslint-disable-next-line no-underscore-dangle
    async _similaritySearchWithScore(query, k, filter) {
        await this.initPromise;
        const { results } = await this.client.document.search(this.collectionName, {
            text: query,
            metadata: assignMetadata(filter),
            limit: k,
        });
        return zepDocsToDocumentsAndScore(results);
    }
    async similaritySearchWithScore(query, k = 4, filter = undefined, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _callbacks = undefined // implement passing to embedQuery later
    ) {
        return this._similaritySearchWithScore(query, k, filter);
    }
    /**
     * Performs a similarity search on the Zep collection.
     *
     * @param {string} query - The query string to search for.
     * @param {number} [k=4] - The number of results to return. Defaults to 4.
     * @param {this["FilterType"] | undefined} [filter=undefined] - An optional set of JSONPath filters to apply to the search.
     * @param {Callbacks | undefined} [_callbacks=undefined] - Optional callbacks. Currently not implemented.
     * @returns {Promise<Document[]>} - A promise that resolves to an array of Documents that are similar to the query.
     *
     * @async
     */
    async similaritySearch(query, k = 4, filter = undefined, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _callbacks = undefined // implement passing to embedQuery later
    ) {
        await this.initPromise;
        const { results: zepResults } = await this.client.document.search(this.collectionName, {
            text: query,
            metadata: assignMetadata(filter),
            limit: k,
        });
        const results = zepDocsToDocumentsAndScore(zepResults);
        return results.map((result) => result[0]);
    }
    /**
     * Return documents selected using the maximal marginal relevance.
     * Maximal marginal relevance optimizes for similarity to the query AND diversity
     * among selected documents.
     *
     * @param {string} query - Text to look up documents similar to.
     * @param options
     * @param {number} options.k - Number of documents to return.
     * @param {number} options.fetchK=20- Number of documents to fetch before passing to the MMR algorithm.
     * @param {number} options.lambda=0.5 - Number between 0 and 1 that determines the degree of diversity among the results,
     *                 where 0 corresponds to maximum diversity and 1 to minimum diversity.
     * @param {Record<string, any>} options.filter - Optional Zep JSONPath query to pre-filter on document metadata field
     *
     * @returns {Promise<Document[]>} - List of documents selected by maximal marginal relevance.
     */
    async maxMarginalRelevanceSearch(query, options) {
        const { k, fetchK = 20, lambda = 0.5, filter } = options;
        const r = await this.client.document.search(this.collectionName, {
            text: query,
            metadata: assignMetadata(filter),
            limit: fetchK,
        });
        const queryEmbedding = Array.from(r.queryVector);
        const results = zepDocsToDocumentsAndScore(r.results);
        const embeddingList = r.results.map((doc) => Array.from(doc.embedding ? doc.embedding : []));
        const mmrIndexes = (0, math_1.maximalMarginalRelevance)(queryEmbedding, embeddingList, lambda, k);
        return mmrIndexes.filter((idx) => idx !== -1).map((idx) => results[idx][0]);
    }
    static async init(zepConfig) {
        const instance = new this(new testing_1.FakeEmbeddings(), zepConfig);
        // Wait for collection to be initialized
        await instance.initPromise;
        return instance;
    }
    /**
     * Creates a new ZepVectorStore instance from an array of texts. Each text is converted into a Document and added to the collection.
     *
     * @param {string[]} texts - The texts to convert into Documents.
     * @param {object[] | object} metadatas - The metadata to associate with each Document.
     * If an array is provided, each element is associated with the corresponding Document.
     * If an object is provided, it is associated with all Documents.
     * @param {Embeddings} embeddings - Pass FakeEmbeddings, Zep Cloud will handle text embedding for you.
     * @param {IZepConfig} zepConfig - The configuration object for the Zep API.
     * @returns {Promise<ZepVectorStore>} - A promise that resolves with the new ZepVectorStore instance.
     */
    static async fromTexts(texts, metadatas, embeddings, zepConfig) {
        const docs = [];
        for (let i = 0; i < texts.length; i += 1) {
            const metadata = Array.isArray(metadatas) ? metadatas[i] : metadatas;
            const newDoc = new documents_1.Document({
                pageContent: texts[i],
                metadata,
            });
            docs.push(newDoc);
        }
        return ZepCloudVectorStore.fromDocuments(docs, embeddings, zepConfig);
    }
    /**
     * Creates a new ZepVectorStore instance from an array of Documents. Each Document is added to a Zep collection.
     *
     * @param {Document[]} docs - The Documents to add.
     * @param {Embeddings} embeddings - Pass FakeEmbeddings, Zep Cloud will handle text embedding for you.
     * @param {IZepConfig} zepConfig - The configuration object for the Zep API.
     * @returns {Promise<ZepVectorStore>} - A promise that resolves with the new ZepVectorStore instance.
     */
    static async fromDocuments(docs, embeddings, zepConfig) {
        const instance = new this(embeddings, zepConfig);
        // Wait for collection to be initialized
        await instance.initPromise;
        await instance.addDocuments(docs);
        return instance;
    }
}
exports.ZepCloudVectorStore = ZepCloudVectorStore;
