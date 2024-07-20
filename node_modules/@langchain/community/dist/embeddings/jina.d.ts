import { Embeddings, EmbeddingsParams } from "@langchain/core/embeddings";
/**
 * Input parameters for the Jina embeddings
 */
export interface JinaEmbeddingsParams extends EmbeddingsParams {
    /**
     * The API key to use for authentication.
     * If not provided, it will be read from the `JINA_API_KEY` environment variable.
     */
    apiKey?: string;
    /**
     * The model ID to use for generating embeddings.
     * Default: `jina-embeddings-v2-base-en`
     */
    model?: string;
}
/**
 * Response from the Jina embeddings API.
 */
export interface JinaEmbeddingsResponse {
    /**
     * The embeddings generated for the input texts.
     */
    data: {
        index: number;
        embedding: number[];
    }[];
    /**
     * The detail of the response e.g usage, model used etc.
     */
    detail?: string;
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
export declare class JinaEmbeddings extends Embeddings implements JinaEmbeddingsParams {
    apiKey: string;
    model: string;
    /**
     * Constructor for the JinaEmbeddings class.
     * @param fields - An optional object with properties to configure the instance.
     */
    constructor(fields?: Partial<JinaEmbeddingsParams> & {
        verbose?: boolean;
    });
    /**
     * Generates embeddings for an array of inputs.
     * @param input - An array of strings or objects to generate embeddings for.
     * @returns A Promise that resolves to an array of embeddings.
     */
    private _embed;
    /**
     * Generates embeddings for an array of texts.
     * @param texts - An array of strings to generate embeddings for.
     * @returns A Promise that resolves to an array of embeddings.
     */
    embedDocuments(texts: string[]): Promise<number[][]>;
    /**
     * Generates an embedding for a single text.
     * @param text - A string to generate an embedding for.
     * @returns A Promise that resolves to an array of numbers representing the embedding.
     */
    embedQuery(text: string): Promise<number[]>;
    /**
     * Generates embeddings for an array of image URIs.
     * @param uris - An array of image URIs to generate embeddings for.
     * @returns A Promise that resolves to an array of embeddings.
     */
    embedImages(uris: string[]): Promise<number[][]>;
}
