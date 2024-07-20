/// <reference types="node" resolution-mode="require"/>
import { type ClientOptions } from "@langchain/openai";
import { Document } from "@langchain/core/documents";
import { BufferLoader } from "./buffer.js";
/**
 * @deprecated - Import from "@langchain/community/document_loaders/fs/openai_whisper_audio" instead. This entrypoint will be removed in 0.3.0.
 *
 * @example
 * ```typescript
 * const loader = new OpenAIWhisperAudio(
 *   "./src/document_loaders/example_data/test.mp3",
 * );
 * const docs = await loader.load();
 * console.log(docs);
 * ```
 */
export declare class OpenAIWhisperAudio extends BufferLoader {
    private readonly openAIClient;
    constructor(filePathOrBlob: string | Blob, fields?: {
        clientOptions?: ClientOptions;
    });
    protected parse(raw: Buffer, metadata: Record<string, string>): Promise<Document[]>;
}
