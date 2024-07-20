import type { BaseLanguageModelCallOptions } from "@langchain/core/language_models/base";
import { CallbackManagerForLLMRun } from "@langchain/core/callbacks/manager";
import { GenerationChunk } from "@langchain/core/outputs";
import { BaseLLMParams, LLM } from "@langchain/core/language_models/llms";
export interface AI {
    canCreateTextSession(): Promise<AIModelAvailability>;
    createTextSession(options?: AITextSessionOptions): Promise<AITextSession>;
    defaultTextSessionOptions(): Promise<AITextSessionOptions>;
}
export interface AITextSession {
    prompt(input: string): Promise<string>;
    promptStreaming(input: string): ReadableStream;
    destroy(): void;
    clone(): AITextSession;
}
export interface AITextSessionOptions {
    topK: number;
    temperature: number;
}
export type AIModelAvailability = "readily" | "after-download" | "no";
export interface ChromeAIInputs extends BaseLLMParams {
    topK?: number;
    temperature?: number;
}
export interface ChromeAICallOptions extends BaseLanguageModelCallOptions {
}
/**
 * To use this model you need to have the `Built-in AI Early Preview Program`
 * for Chrome. You can find more information about the program here:
 * @link https://developer.chrome.com/docs/ai/built-in
 *
 * @example
 * ```typescript
 * // Initialize the ChromeAI model.
 * const model = new ChromeAI({
 *   temperature: 0.5, // Optional. Default is 0.5.
 *   topK: 40, // Optional. Default is 40.
 * });
 *
 * // Call the model with a message and await the response.
 * const response = await model.invoke([
 *   new HumanMessage({ content: "My name is John." }),
 * ]);
 * ```
 */
export declare class ChromeAI extends LLM<ChromeAICallOptions> {
    session?: AITextSession;
    temperature: number;
    topK: number;
    static lc_name(): string;
    constructor(inputs?: ChromeAIInputs);
    _llmType(): string;
    /**
     * Initialize the model. This method may be called before invoking the model
     * to set up a chat session in advance.
     */
    initialize(): Promise<void>;
    /**
     * Call `.destroy()` to free resources if you no longer need a session.
     * When a session is destroyed, it can no longer be used, and any ongoing
     * execution will be aborted. You may want to keep the session around if
     * you intend to prompt the model often since creating a session can take
     * some time.
     */
    destroy(): void;
    _streamResponseChunks(prompt: string, _options: this["ParsedCallOptions"], runManager?: CallbackManagerForLLMRun): AsyncGenerator<GenerationChunk>;
    _call(prompt: string, options: this["ParsedCallOptions"], runManager?: CallbackManagerForLLMRun): Promise<string>;
}
