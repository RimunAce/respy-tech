import { Embeddings, type EmbeddingsParams } from "@langchain/core/embeddings";
/**
 * Interface that extends EmbeddingsParams and defines additional
 * parameters specific to the ZhipuAIEmbeddingsParams class.
 */
export interface ZhipuAIEmbeddingsParams extends EmbeddingsParams {
    /**
     * Model Name to use
     */
    modelName?: "embedding-2";
    /**
     * ZhipuAI API key to use
     */
    apiKey?: string;
    /**
     * Whether to strip new lines from the input text.
     */
    stripNewLines?: boolean;
}
interface EmbeddingData {
    embedding: number[];
    index: number;
    object: string;
}
interface TokenUsage {
    completion_tokens: number;
    prompt_tokens: number;
    total_tokens: number;
}
export interface ZhipuAIEmbeddingsResult {
    model: string;
    data: EmbeddingData[];
    object: string;
    usage: TokenUsage;
}
export declare class ZhipuAIEmbeddings extends Embeddings implements ZhipuAIEmbeddingsParams {
    modelName: ZhipuAIEmbeddingsParams["modelName"];
    apiKey?: string;
    stripNewLines: boolean;
    private embeddingsAPIURL;
    constructor(fields?: ZhipuAIEmbeddingsParams);
    /**
     * Private method to make a request to the TogetherAI API to generate
     * embeddings. Handles the retry logic and returns the response from the API.
     * @param {string} input The input text to embed.
     * @returns Promise that resolves to the response from the API.
     * @TODO Figure out return type and statically type it.
     */
    private embeddingWithRetry;
    /**
     * Method to generate an embedding for a single document. Calls the
     * embeddingWithRetry method with the document as the input.
     * @param {string} text Document to generate an embedding for.
     * @returns {Promise<number[]>} Promise that resolves to an embedding for the document.
     */
    embedQuery(text: string): Promise<number[]>;
    /**
     * Method that takes an array of documents as input and returns a promise
     * that resolves to a 2D array of embeddings for each document. It calls
     * the embedQuery method for each document in the array.
     * @param documents Array of documents for which to generate embeddings.
     * @returns Promise that resolves to a 2D array of embeddings for each input document.
     */
    embedDocuments(documents: string[]): Promise<number[][]>;
}
export {};
