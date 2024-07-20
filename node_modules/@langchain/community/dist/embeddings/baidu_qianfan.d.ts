import { Embeddings, type EmbeddingsParams } from "@langchain/core/embeddings";
/** @deprecated Install and import from @langchain/baidu-qianfan instead. */
export interface BaiduQianfanEmbeddingsParams extends EmbeddingsParams {
    /** Model name to use */
    modelName: "embedding-v1" | "bge_large_zh" | "bge_large_en" | "tao-8k";
    /**
     * Timeout to use when making requests to BaiduQianfan.
     */
    timeout?: number;
    /**
     * The maximum number of characters allowed for embedding in a single request varies by model:
     * - Embedding-V1 model: up to 1000 characters
     * - bge-large-zh model: up to 2000 characters
     * - bge-large-en model: up to 2000 characters
     * - tao-8k model: up to 28000 characters
     *
     * Note: These limits are model-specific and should be adhered to for optimal performance.
     */
    batchSize?: number;
    /**
     * Whether to strip new lines from the input text.
     */
    stripNewLines?: boolean;
}
export declare class BaiduQianfanEmbeddings extends Embeddings implements BaiduQianfanEmbeddingsParams {
    modelName: BaiduQianfanEmbeddingsParams["modelName"];
    batchSize: number;
    stripNewLines: boolean;
    baiduApiKey: string;
    baiduSecretKey: string;
    accessToken: string;
    constructor(fields?: Partial<BaiduQianfanEmbeddingsParams> & {
        verbose?: boolean;
        baiduApiKey?: string;
        baiduSecretKey?: string;
    });
    /**
     * Method to generate embeddings for an array of documents. Splits the
     * documents into batches and makes requests to the BaiduQianFan API to generate
     * embeddings.
     * @param texts Array of documents to generate embeddings for.
     * @returns Promise that resolves to a 2D array of embeddings for each document.
     */
    embedDocuments(texts: string[]): Promise<number[][]>;
    /**
     * Method to generate an embedding for a single document. Calls the
     * embeddingWithRetry method with the document as the input.
     * @param text Document to generate an embedding for.
     * @returns Promise that resolves to an embedding for the document.
     */
    embedQuery(text: string): Promise<number[]>;
    /**
     * Method to generate an embedding params.
     * @param texts Array of documents to generate embeddings for.
     * @returns an embedding params.
     */
    private getParams;
    /**
     * Private method to make a request to the BaiduAI API to generate
     * embeddings. Handles the retry logic and returns the response from the
     * API.
     * @param request Request to send to the BaiduAI API.
     * @returns Promise that resolves to the response from the API.
     */
    private embeddingWithRetry;
    /**
     * Method that retrieves the access token for making requests to the Baidu
     * API.
     * @returns The access token for making requests to the Baidu API.
     */
    private getAccessToken;
}
