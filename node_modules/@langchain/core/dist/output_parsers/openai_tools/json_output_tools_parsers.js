import { BaseLLMOutputParser, OutputParserException } from "../base.js";
import { parsePartialJson } from "../json.js";
export function parseToolCall(
// eslint-disable-next-line @typescript-eslint/no-explicit-any
rawToolCall, options) {
    if (rawToolCall.function === undefined) {
        return undefined;
    }
    let functionArgs;
    if (options?.partial) {
        try {
            functionArgs = parsePartialJson(rawToolCall.function.arguments ?? "{}");
        }
        catch (e) {
            return undefined;
        }
    }
    else {
        try {
            functionArgs = JSON.parse(rawToolCall.function.arguments);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }
        catch (e) {
            throw new OutputParserException([
                `Function "${rawToolCall.function.name}" arguments:`,
                ``,
                rawToolCall.function.arguments,
                ``,
                `are not valid JSON.`,
                `Error: ${e.message}`,
            ].join("\n"));
        }
    }
    const parsedToolCall = {
        name: rawToolCall.function.name,
        args: functionArgs,
        type: "tool_call",
    };
    if (options?.returnId) {
        parsedToolCall.id = rawToolCall.id;
    }
    return parsedToolCall;
}
export function convertLangChainToolCallToOpenAI(toolCall) {
    if (toolCall.id === undefined) {
        throw new Error(`All OpenAI tool calls must have an "id" field.`);
    }
    return {
        id: toolCall.id,
        type: "function",
        function: {
            name: toolCall.name,
            arguments: JSON.stringify(toolCall.args),
        },
    };
}
export function makeInvalidToolCall(
// eslint-disable-next-line @typescript-eslint/no-explicit-any
rawToolCall, errorMsg) {
    return {
        name: rawToolCall.function?.name,
        args: rawToolCall.function?.arguments,
        id: rawToolCall.id,
        error: errorMsg,
        type: "invalid_tool_call",
    };
}
/**
 * Class for parsing the output of a tool-calling LLM into a JSON object.
 */
export class JsonOutputToolsParser extends BaseLLMOutputParser {
    static lc_name() {
        return "JsonOutputToolsParser";
    }
    constructor(fields) {
        super(fields);
        Object.defineProperty(this, "returnId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "lc_namespace", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ["langchain", "output_parsers", "openai_tools"]
        });
        Object.defineProperty(this, "lc_serializable", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
        this.returnId = fields?.returnId ?? this.returnId;
    }
    /**
     * Parses the output and returns a JSON object. If `argsOnly` is true,
     * only the arguments of the function call are returned.
     * @param generations The output of the LLM to parse.
     * @returns A JSON object representation of the function call or its arguments.
     */
    async parseResult(generations) {
        const toolCalls = generations[0].message.additional_kwargs.tool_calls;
        if (!toolCalls) {
            throw new Error(`No tools_call in message ${JSON.stringify(generations)}`);
        }
        const clonedToolCalls = JSON.parse(JSON.stringify(toolCalls));
        const parsedToolCalls = [];
        for (const toolCall of clonedToolCalls) {
            const parsedToolCall = parseToolCall(toolCall, { partial: true });
            if (parsedToolCall !== undefined) {
                // backward-compatibility with previous
                // versions of Langchain JS, which uses `name` and `arguments`
                // @ts-expect-error name and arguemnts are defined by Object.defineProperty
                const backwardsCompatibleToolCall = {
                    type: parsedToolCall.name,
                    args: parsedToolCall.args,
                    id: parsedToolCall.id,
                };
                Object.defineProperty(backwardsCompatibleToolCall, "name", {
                    get() {
                        return this.type;
                    },
                });
                Object.defineProperty(backwardsCompatibleToolCall, "arguments", {
                    get() {
                        return this.args;
                    },
                });
                parsedToolCalls.push(backwardsCompatibleToolCall);
            }
        }
        return parsedToolCalls;
    }
}
/**
 * Class for parsing the output of a tool-calling LLM into a JSON object if you are
 * expecting only a single tool to be called.
 */
export class JsonOutputKeyToolsParser extends BaseLLMOutputParser {
    static lc_name() {
        return "JsonOutputKeyToolsParser";
    }
    constructor(params) {
        super(params);
        Object.defineProperty(this, "lc_namespace", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ["langchain", "output_parsers", "openai_tools"]
        });
        Object.defineProperty(this, "lc_serializable", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
        Object.defineProperty(this, "returnId", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        /** The type of tool calls to return. */
        Object.defineProperty(this, "keyName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /** Whether to return only the first tool call. */
        Object.defineProperty(this, "returnSingle", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "initialParser", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "zodSchema", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.keyName = params.keyName;
        this.returnSingle = params.returnSingle ?? this.returnSingle;
        this.initialParser = new JsonOutputToolsParser(params);
        this.zodSchema = params.zodSchema;
    }
    async _validateResult(result) {
        if (this.zodSchema === undefined) {
            return result;
        }
        const zodParsedResult = await this.zodSchema.safeParseAsync(result);
        if (zodParsedResult.success) {
            return zodParsedResult.data;
        }
        else {
            throw new OutputParserException(`Failed to parse. Text: "${JSON.stringify(result, null, 2)}". Error: ${JSON.stringify(zodParsedResult.error.errors)}`, JSON.stringify(result, null, 2));
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async parseResult(generations) {
        const results = await this.initialParser.parseResult(generations);
        const matchingResults = results.filter((result) => result.type === this.keyName);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let returnedValues = matchingResults;
        if (!this.returnId) {
            returnedValues = matchingResults.map((result) => result.args);
        }
        if (this.returnSingle) {
            return this._validateResult(returnedValues[0]);
        }
        const toolCallResults = await Promise.all(returnedValues.map((value) => this._validateResult(value)));
        return toolCallResults;
    }
}
