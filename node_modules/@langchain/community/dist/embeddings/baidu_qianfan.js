import { Embeddings } from "@langchain/core/embeddings";
import { chunkArray } from "@langchain/core/utils/chunk_array";
import { getEnvironmentVariable } from "@langchain/core/utils/env";
export class BaiduQianfanEmbeddings extends Embeddings {
    constructor(fields) {
        const fieldsWithDefaults = { maxConcurrency: 2, ...fields };
        super(fieldsWithDefaults);
        Object.defineProperty(this, "modelName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "embedding-v1"
        });
        Object.defineProperty(this, "batchSize", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 16
        });
        Object.defineProperty(this, "stripNewLines", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
        Object.defineProperty(this, "baiduApiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "baiduSecretKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "accessToken", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        const baiduApiKey = fieldsWithDefaults?.baiduApiKey ??
            getEnvironmentVariable("BAIDU_API_KEY");
        const baiduSecretKey = fieldsWithDefaults?.baiduSecretKey ??
            getEnvironmentVariable("BAIDU_SECRET_KEY");
        if (!baiduApiKey) {
            throw new Error("Baidu API key not found");
        }
        if (!baiduSecretKey) {
            throw new Error("Baidu Secret key not found");
        }
        this.baiduApiKey = baiduApiKey;
        this.baiduSecretKey = baiduSecretKey;
        this.modelName = fieldsWithDefaults?.modelName ?? this.modelName;
        if (this.modelName === "tao-8k") {
            if (fieldsWithDefaults?.batchSize && fieldsWithDefaults.batchSize !== 1) {
                throw new Error("tao-8k model supports only a batchSize of 1. Please adjust your batchSize accordingly");
            }
            this.batchSize = 1;
        }
        else {
            this.batchSize = fieldsWithDefaults?.batchSize ?? this.batchSize;
        }
        this.stripNewLines =
            fieldsWithDefaults?.stripNewLines ?? this.stripNewLines;
    }
    /**
     * Method to generate embeddings for an array of documents. Splits the
     * documents into batches and makes requests to the BaiduQianFan API to generate
     * embeddings.
     * @param texts Array of documents to generate embeddings for.
     * @returns Promise that resolves to a 2D array of embeddings for each document.
     */
    async embedDocuments(texts) {
        const batches = chunkArray(this.stripNewLines ? texts.map((t) => t.replace(/\n/g, " ")) : texts, this.batchSize);
        const batchRequests = batches.map((batch) => {
            const params = this.getParams(batch);
            return this.embeddingWithRetry(params);
        });
        const batchResponses = await Promise.all(batchRequests);
        const embeddings = [];
        for (let i = 0; i < batchResponses.length; i += 1) {
            const batch = batches[i];
            const batchResponse = batchResponses[i] || [];
            for (let j = 0; j < batch.length; j += 1) {
                embeddings.push(batchResponse[j]);
            }
        }
        return embeddings;
    }
    /**
     * Method to generate an embedding for a single document. Calls the
     * embeddingWithRetry method with the document as the input.
     * @param text Document to generate an embedding for.
     * @returns Promise that resolves to an embedding for the document.
     */
    async embedQuery(text) {
        const params = this.getParams([
            this.stripNewLines ? text.replace(/\n/g, " ") : text,
        ]);
        const embeddings = (await this.embeddingWithRetry(params)) || [[]];
        return embeddings[0];
    }
    /**
     * Method to generate an embedding params.
     * @param texts Array of documents to generate embeddings for.
     * @returns an embedding params.
     */
    getParams(texts) {
        return {
            input: texts,
        };
    }
    /**
     * Private method to make a request to the BaiduAI API to generate
     * embeddings. Handles the retry logic and returns the response from the
     * API.
     * @param request Request to send to the BaiduAI API.
     * @returns Promise that resolves to the response from the API.
     */
    async embeddingWithRetry(body) {
        if (!this.accessToken) {
            this.accessToken = await this.getAccessToken();
        }
        return fetch(`https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/embeddings/${this.modelName}?access_token=${this.accessToken}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        }).then(async (response) => {
            const embeddingData = await response.json();
            if ("error_code" in embeddingData && embeddingData.error_code) {
                throw new Error(`${embeddingData.error_code}: ${embeddingData.error_msg}`);
            }
            return embeddingData.data.map(({ embedding }) => embedding);
        });
    }
    /**
     * Method that retrieves the access token for making requests to the Baidu
     * API.
     * @returns The access token for making requests to the Baidu API.
     */
    async getAccessToken() {
        const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${this.baiduApiKey}&client_secret=${this.baiduSecretKey}`;
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
        });
        if (!response.ok) {
            const text = await response.text();
            const error = new Error(`Baidu get access token failed with status code ${response.status}, response: ${text}`);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            error.response = response;
            throw error;
        }
        const json = await response.json();
        return json.access_token;
    }
}
