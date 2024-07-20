import { type ClientOptions, OpenAI as OpenAIClient } from "openai";
import { OpenAIEmbeddings, OpenAIEmbeddingsParams } from "../embeddings.js";
import { AzureOpenAIInput, LegacyOpenAIInput } from "../types.js";
export declare class AzureOpenAIEmbeddings extends OpenAIEmbeddings {
    constructor(fields?: Partial<OpenAIEmbeddingsParams> & Partial<AzureOpenAIInput> & {
        verbose?: boolean;
        /** The OpenAI API key to use. */
        apiKey?: string;
        configuration?: ClientOptions;
        deploymentName?: string;
        openAIApiVersion?: string;
    }, configuration?: ClientOptions & LegacyOpenAIInput);
    protected embeddingWithRetry(request: OpenAIClient.EmbeddingCreateParams): Promise<OpenAIClient.Embeddings.CreateEmbeddingResponse>;
}
