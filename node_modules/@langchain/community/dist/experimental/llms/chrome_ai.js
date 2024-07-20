import { GenerationChunk } from "@langchain/core/outputs";
import { IterableReadableStream } from "@langchain/core/utils/stream";
import { LLM } from "@langchain/core/language_models/llms";
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
export class ChromeAI extends LLM {
    static lc_name() {
        return "ChromeAI";
    }
    constructor(inputs) {
        super({
            ...inputs,
        });
        Object.defineProperty(this, "session", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "temperature", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0.5
        });
        Object.defineProperty(this, "topK", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 40
        });
        this.temperature = inputs?.temperature ?? this.temperature;
        this.topK = inputs?.topK ?? this.topK;
    }
    _llmType() {
        return "chrome_ai";
    }
    /**
     * Initialize the model. This method may be called before invoking the model
     * to set up a chat session in advance.
     */
    async initialize() {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let ai;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (typeof window !== "undefined" && window.ai !== undefined) {
            // Browser context
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ai = window.ai;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }
        else if (typeof self !== undefined && self.ai !== undefined) {
            // Worker context
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ai = self.ai;
        }
        else {
            throw new Error("Could not initialize ChromeAI instance. Make sure you are running a version of Chrome with the proper experimental flags enabled.");
        }
        const canCreateTextSession = await ai.canCreateTextSession();
        if (canCreateTextSession === "no") {
            throw new Error("The AI model is not available.");
        }
        else if (canCreateTextSession === "after-download") {
            throw new Error("The AI model is not yet downloaded.");
        }
        this.session = await ai.createTextSession({
            topK: this.topK,
            temperature: this.temperature,
        });
    }
    /**
     * Call `.destroy()` to free resources if you no longer need a session.
     * When a session is destroyed, it can no longer be used, and any ongoing
     * execution will be aborted. You may want to keep the session around if
     * you intend to prompt the model often since creating a session can take
     * some time.
     */
    destroy() {
        if (!this.session) {
            return console.log("No session found. Returning.");
        }
        this.session.destroy();
    }
    async *_streamResponseChunks(prompt, _options, runManager) {
        if (!this.session) {
            await this.initialize();
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const stream = this.session.promptStreaming(prompt);
        const iterableStream = IterableReadableStream.fromReadableStream(stream);
        let previousContent = "";
        for await (const chunk of iterableStream) {
            const newContent = chunk.slice(previousContent.length);
            previousContent += newContent;
            yield new GenerationChunk({
                text: newContent,
            });
            await runManager?.handleLLMNewToken(newContent);
        }
    }
    async _call(prompt, options, runManager) {
        const chunks = [];
        for await (const chunk of this._streamResponseChunks(prompt, options, runManager)) {
            chunks.push(chunk.text);
        }
        return chunks.join("");
    }
}
