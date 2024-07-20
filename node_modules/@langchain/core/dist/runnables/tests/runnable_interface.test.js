/* eslint-disable no-promise-executor-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { StringOutputParser } from "../../output_parsers/string.js";
import { PromptTemplate } from "../../prompts/prompt.js";
import { RunnableSequence } from "../base.js";
class IterableReadableStreamV0 extends ReadableStream {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "reader", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
    ensureReader() {
        if (!this.reader) {
            this.reader = this.getReader();
        }
    }
    async next() {
        this.ensureReader();
        try {
            const result = await this.reader.read();
            if (result.done)
                this.reader.releaseLock(); // release lock when stream becomes closed
            return {
                done: result.done,
                value: result.value, // Cloudflare Workers typing fix
            };
        }
        catch (e) {
            this.reader.releaseLock(); // release lock when stream becomes errored
            throw e;
        }
    }
    async return() {
        this.ensureReader();
        // If wrapped in a Node stream, cancel is already called.
        if (this.locked) {
            const cancelPromise = this.reader.cancel(); // cancel first, but don't await yet
            this.reader.releaseLock(); // release lock first
            await cancelPromise; // now await it
        }
        return { done: true, value: undefined }; // This cast fixes TS typing, and convention is to ignore final chunk value anyway
    }
    async throw(e) {
        throw e;
    }
    [Symbol.asyncIterator]() {
        return this;
    }
    static fromReadableStream(stream) {
        // From https://developer.mozilla.org/en-US/docs/Web/API/Streams_API/Using_readable_streams#reading_the_stream
        const reader = stream.getReader();
        return new IterableReadableStreamV0({
            start(controller) {
                return pump();
                function pump() {
                    return reader.read().then(({ done, value }) => {
                        // When no more data needs to be consumed, close the stream
                        if (done) {
                            controller.close();
                            return;
                        }
                        // Enqueue the next data chunk into our target stream
                        controller.enqueue(value);
                        return pump();
                    });
                }
            },
            cancel() {
                reader.releaseLock();
            },
        });
    }
    static fromAsyncGenerator(generator) {
        return new IterableReadableStreamV0({
            async pull(controller) {
                const { value, done } = await generator.next();
                // When no more data needs to be consumed, close the stream
                if (done) {
                    controller.close();
                }
                // Fix: `else if (value)` will hang the streaming when nullish value (e.g. empty string) is pulled
                controller.enqueue(value);
            },
        });
    }
}
/**
 * Base class for all types of messages in a conversation. It includes
 * properties like `content`, `name`, and `additional_kwargs`. It also
 * includes methods like `toDict()` and `_getType()`.
 */
class AIMessageV0 {
    /** The type of the message. */
    _getType() {
        return "ai";
    }
    constructor(content) {
        Object.defineProperty(this, "lc_namespace", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ["langchain_core", "messages"]
        });
        Object.defineProperty(this, "lc_serializable", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
        /** The content of the message. */
        Object.defineProperty(this, "content", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /** The name of the message sender in a multi-user chat. */
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.content = content;
    }
}
class StringPromptValueV0 {
    constructor(value) {
        Object.defineProperty(this, "lc_namespace", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ["langchain_core", "prompt_values"]
        });
        Object.defineProperty(this, "lc_serializable", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
        Object.defineProperty(this, "value", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.value = value;
    }
    toString() {
        return this.value;
    }
}
class RunnableV0 {
    constructor() {
        Object.defineProperty(this, "lc_serializable", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
        Object.defineProperty(this, "lc_runnable", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
    }
    async invoke(input, _options) {
        return new AIMessageV0(input.toString());
    }
    async batch(_inputs, _options, _batchOptions) {
        return [];
    }
    async stream(_input, _options) {
        throw new Error("Not implemented");
    }
    // eslint-disable-next-line require-yield
    async *transform(_generator, _options) {
        throw new Error("Not implemented");
    }
    getName() {
        return "TEST";
    }
    get lc_id() {
        return ["TEST"];
    }
}
test("Pipe with a class that implements a runnable interface", async () => {
    const promptTemplate = PromptTemplate.fromTemplate("{input}");
    const llm = new RunnableV0();
    const outputParser = new StringOutputParser();
    const runnable = promptTemplate.pipe(llm).pipe(outputParser);
    const result = await runnable.invoke({ input: "Hello world!!" });
    console.log(result);
    expect(result).toBe("Hello world!!");
});
test("Runnable sequence with a class that implements a runnable interface", async () => {
    const promptTemplate = PromptTemplate.fromTemplate("{input}");
    const llm = new RunnableV0();
    const outputParser = new StringOutputParser();
    const runnable = RunnableSequence.from([promptTemplate, llm, outputParser]);
    const result = await runnable.invoke({ input: "Hello sequence!!" });
    console.log(result);
    expect(result).toBe("Hello sequence!!");
});
