import { existsSync, readFileSync } from "fs";
import { parse } from "url";
import { Embeddings } from "@langchain/core/embeddings";
import { getEnvironmentVariable } from "@langchain/core/utils/env";
/**
 * The default Jina API URL for embedding requests.
 */
const JINA_API_URL = "https://api.jina.ai/v1/embeddings";
/**
 * Check if a URL is a local file.
 * @param url - The URL to check.
 * @returns True if the URL is a local file, False otherwise.
 */
function isLocal(url) {
    const urlParsed = parse(url);
    if (urlParsed.protocol === null || urlParsed.protocol === "file:") {
        return existsSync(urlParsed.pathname || "");
    }
    return false;
}
/**
 * Get the bytes string of a file.
 * @param filePath - The path to the file.
 * @returns The bytes string of the file.
 */
function getBytesStr(filePath) {
    const imageFile = readFileSync(filePath);
    return Buffer.from(imageFile).toString("base64");
}
/**
 * A class for generating embeddings using the Jina API.
 * @example
 * ```typescript
 * // Embed a query using the JinaEmbeddings class
 * const model = new JinaEmbeddings();
 * const res = await model.embedQuery(
 *   "What would be a good name for a semantic search engine ?",
 * );
 * console.log({ res });
 * ```
 */
export class JinaEmbeddings extends Embeddings {
    /**
     * Constructor for the JinaEmbeddings class.
     * @param fields - An optional object with properties to configure the instance.
     */
    constructor(fields) {
        const fieldsWithDefaults = {
            model: "jina-embeddings-v2-base-en",
            ...fields,
        };
        super(fieldsWithDefaults);
        Object.defineProperty(this, "apiKey", {
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
        const apiKey = fieldsWithDefaults?.apiKey ||
            getEnvironmentVariable("JINA_API_KEY") ||
            getEnvironmentVariable("JINA_AUTH_TOKEN");
        if (!apiKey) {
            throw new Error("Jina API key not found");
        }
        this.model = fieldsWithDefaults?.model ?? this.model;
        this.apiKey = apiKey;
    }
    /**
     * Generates embeddings for an array of inputs.
     * @param input - An array of strings or objects to generate embeddings for.
     * @returns A Promise that resolves to an array of embeddings.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async _embed(input) {
        const response = await fetch(JINA_API_URL, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ input, model: this.model }),
        });
        const json = (await response.json());
        if (!json.data) {
            throw new Error(json.detail || "Unknown error from Jina API");
        }
        const sortedEmbeddings = json.data.sort((a, b) => a.index - b.index);
        return sortedEmbeddings.map((item) => item.embedding);
    }
    /**
     * Generates embeddings for an array of texts.
     * @param texts - An array of strings to generate embeddings for.
     * @returns A Promise that resolves to an array of embeddings.
     */
    async embedDocuments(texts) {
        return this._embed(texts);
    }
    /**
     * Generates an embedding for a single text.
     * @param text - A string to generate an embedding for.
     * @returns A Promise that resolves to an array of numbers representing the embedding.
     */
    async embedQuery(text) {
        const embeddings = await this._embed([text]);
        return embeddings[0];
    }
    /**
     * Generates embeddings for an array of image URIs.
     * @param uris - An array of image URIs to generate embeddings for.
     * @returns A Promise that resolves to an array of embeddings.
     */
    async embedImages(uris) {
        const input = uris.map((uri) => (isLocal(uri) ? getBytesStr(uri) : uri));
        return this._embed(input);
    }
}
