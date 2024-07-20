import { Embeddings } from "@langchain/core/embeddings";
import { chunkArray } from "@langchain/core/utils/chunk_array";
/**
 * @example
 * ```typescript
 * const model = new HuggingFaceTransformersEmbeddings({
 *   model: "Xenova/all-MiniLM-L6-v2",
 * });
 *
 * // Embed a single query
 * const res = await model.embedQuery(
 *   "What would be a good company name for a company that makes colorful socks?"
 * );
 * console.log({ res });
 *
 * // Embed multiple documents
 * const documentRes = await model.embedDocuments(["Hello world", "Bye bye"]);
 * console.log({ documentRes });
 * ```
 */
export class HuggingFaceTransformersEmbeddings extends Embeddings {
    constructor(fields) {
        super(fields ?? {});
        Object.defineProperty(this, "modelName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "Xenova/all-MiniLM-L6-v2"
        });
        Object.defineProperty(this, "model", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "Xenova/all-MiniLM-L6-v2"
        });
        Object.defineProperty(this, "batchSize", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 512
        });
        Object.defineProperty(this, "stripNewLines", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
        Object.defineProperty(this, "timeout", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "pretrainedOptions", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "pipelineOptions", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "pipelinePromise", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.modelName = fields?.model ?? fields?.modelName ?? this.model;
        this.model = this.modelName;
        this.stripNewLines = fields?.stripNewLines ?? this.stripNewLines;
        this.timeout = fields?.timeout;
        this.pretrainedOptions = fields?.pretrainedOptions ?? {};
        this.pipelineOptions = {
            pooling: "mean",
            normalize: true,
            ...fields?.pipelineOptions,
        };
    }
    async embedDocuments(texts) {
        const batches = chunkArray(this.stripNewLines ? texts.map((t) => t.replace(/\n/g, " ")) : texts, this.batchSize);
        const batchRequests = batches.map((batch) => this.runEmbedding(batch));
        const batchResponses = await Promise.all(batchRequests);
        const embeddings = [];
        for (let i = 0; i < batchResponses.length; i += 1) {
            const batchResponse = batchResponses[i];
            for (let j = 0; j < batchResponse.length; j += 1) {
                embeddings.push(batchResponse[j]);
            }
        }
        return embeddings;
    }
    async embedQuery(text) {
        const data = await this.runEmbedding([
            this.stripNewLines ? text.replace(/\n/g, " ") : text,
        ]);
        return data[0];
    }
    async runEmbedding(texts) {
        const pipe = await (this.pipelinePromise ??= (await import("@xenova/transformers")).pipeline("feature-extraction", this.model, this.pretrainedOptions));
        return this.caller.call(async () => {
            const output = await pipe(texts, this.pipelineOptions);
            return output.tolist();
        });
    }
}
