"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrapSDK = exports.wrapOpenAI = void 0;
const traceable_js_1 = require("../traceable.cjs");
function _combineChatCompletionChoices(choices
// eslint-disable-next-line @typescript-eslint/no-explicit-any
) {
    const reversedChoices = choices.slice().reverse();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const message = {
        role: "assistant",
        content: "",
    };
    for (const c of reversedChoices) {
        if (c.delta.role) {
            message["role"] = c.delta.role;
            break;
        }
    }
    const toolCalls = {};
    for (const c of choices) {
        if (c.delta.content) {
            message.content = message.content.concat(c.delta.content);
        }
        if (c.delta.function_call) {
            if (!message.function_call) {
                message.function_call = { name: "", arguments: "" };
            }
            if (c.delta.function_call.name) {
                message.function_call.name += c.delta.function_call.name;
            }
            if (c.delta.function_call.arguments) {
                message.function_call.arguments += c.delta.function_call.arguments;
            }
        }
        if (c.delta.tool_calls) {
            for (const tool_call of c.delta.tool_calls) {
                if (!toolCalls[c.index]) {
                    toolCalls[c.index] = [];
                }
                toolCalls[c.index].push(tool_call);
            }
        }
    }
    if (Object.keys(toolCalls).length > 0) {
        message.tool_calls = [...Array(Object.keys(toolCalls).length)];
        for (const [index, toolCallChunks] of Object.entries(toolCalls)) {
            const idx = parseInt(index);
            message.tool_calls[idx] = {
                index: idx,
                id: toolCallChunks.find((c) => c.id)?.id || null,
                type: toolCallChunks.find((c) => c.type)?.type || null,
            };
            for (const chunk of toolCallChunks) {
                if (chunk.function) {
                    if (!message.tool_calls[idx].function) {
                        message.tool_calls[idx].function = {
                            name: "",
                            arguments: "",
                        };
                    }
                    if (chunk.function.name) {
                        message.tool_calls[idx].function.name += chunk.function.name;
                    }
                    if (chunk.function.arguments) {
                        message.tool_calls[idx].function.arguments +=
                            chunk.function.arguments;
                    }
                }
            }
        }
    }
    return {
        index: choices[0].index,
        finish_reason: reversedChoices.find((c) => c.finish_reason) || null,
        message: message,
    };
}
const chatAggregator = (chunks) => {
    if (!chunks || chunks.length === 0) {
        return { choices: [{ message: { role: "assistant", content: "" } }] };
    }
    const choicesByIndex = {};
    for (const chunk of chunks) {
        for (const choice of chunk.choices) {
            if (choicesByIndex[choice.index] === undefined) {
                choicesByIndex[choice.index] = [];
            }
            choicesByIndex[choice.index].push(choice);
        }
    }
    const aggregatedOutput = chunks[chunks.length - 1];
    aggregatedOutput.choices = Object.values(choicesByIndex).map((choices) => _combineChatCompletionChoices(choices));
    return aggregatedOutput;
};
const textAggregator = (allChunks
// eslint-disable-next-line @typescript-eslint/no-explicit-any
) => {
    if (allChunks.length === 0) {
        return { choices: [{ text: "" }] };
    }
    const allContent = [];
    for (const chunk of allChunks) {
        const content = chunk.choices[0].text;
        if (content != null) {
            allContent.push(content);
        }
    }
    const content = allContent.join("");
    const aggregatedOutput = allChunks[allChunks.length - 1];
    aggregatedOutput.choices = [
        { ...aggregatedOutput.choices[0], text: content },
    ];
    return aggregatedOutput;
};
/**
 * Wraps an OpenAI client's completion methods, enabling automatic LangSmith
 * tracing. Method signatures are unchanged, with the exception that you can pass
 * an additional and optional "langsmithExtra" field within the second parameter.
 * @param openai An OpenAI client instance.
 * @param options LangSmith options.
 * @example
 * ```ts
 * const patchedStream = await patchedClient.chat.completions.create(
 *   {
 *     messages: [{ role: "user", content: `Say 'foo'` }],
 *     model: "gpt-3.5-turbo",
 *     stream: true,
 *   },
 *   {
 *     langsmithExtra: {
 *       metadata: {
 *         additional_data: "bar",
 *       },
 *     },
 *   },
 * );
 * ```
 */
const wrapOpenAI = (openai, options) => {
    if ((0, traceable_js_1.isTraceableFunction)(openai.chat.completions.create) ||
        (0, traceable_js_1.isTraceableFunction)(openai.completions.create)) {
        throw new Error("This instance of OpenAI client has been already wrapped once.");
    }
    openai.chat.completions.create = (0, traceable_js_1.traceable)(openai.chat.completions.create.bind(openai.chat.completions), {
        name: "ChatOpenAI",
        run_type: "llm",
        aggregator: chatAggregator,
        argsConfigPath: [1, "langsmithExtra"],
        getInvocationParams: (payload) => {
            if (typeof payload !== "object" || payload == null)
                return undefined;
            // we can safely do so, as the types are not exported in TSC
            const params = payload;
            const ls_stop = (typeof params.stop === "string" ? [params.stop] : params.stop) ??
                undefined;
            return {
                ls_provider: "openai",
                ls_model_type: "chat",
                ls_model_name: params.model,
                ls_max_tokens: params.max_tokens ?? undefined,
                ls_temperature: params.temperature ?? undefined,
                ls_stop,
            };
        },
        ...options,
    });
    openai.completions.create = (0, traceable_js_1.traceable)(openai.completions.create.bind(openai.completions), {
        name: "OpenAI",
        run_type: "llm",
        aggregator: textAggregator,
        argsConfigPath: [1, "langsmithExtra"],
        getInvocationParams: (payload) => {
            if (typeof payload !== "object" || payload == null)
                return undefined;
            // we can safely do so, as the types are not exported in TSC
            const params = payload;
            const ls_stop = (typeof params.stop === "string" ? [params.stop] : params.stop) ??
                undefined;
            return {
                ls_provider: "openai",
                ls_model_type: "text",
                ls_model_name: params.model,
                ls_max_tokens: params.max_tokens ?? undefined,
                ls_temperature: params.temperature ?? undefined,
                ls_stop,
            };
        },
        ...options,
    });
    return openai;
};
exports.wrapOpenAI = wrapOpenAI;
const _wrapClient = (sdk, runName, options) => {
    return new Proxy(sdk, {
        get(target, propKey, receiver) {
            const originalValue = target[propKey];
            if (typeof originalValue === "function") {
                return (0, traceable_js_1.traceable)(originalValue.bind(target), Object.assign({ name: [runName, propKey.toString()].join("."), run_type: "llm" }, options));
            }
            else if (originalValue != null &&
                !Array.isArray(originalValue) &&
                // eslint-disable-next-line no-instanceof/no-instanceof
                !(originalValue instanceof Date) &&
                typeof originalValue === "object") {
                return _wrapClient(originalValue, [runName, propKey.toString()].join("."), options);
            }
            else {
                return Reflect.get(target, propKey, receiver);
            }
        },
    });
};
/**
 * Wrap an arbitrary SDK, enabling automatic LangSmith tracing.
 * Method signatures are unchanged.
 *
 * Note that this will wrap and trace ALL SDK methods, not just
 * LLM completion methods. If the passed SDK contains other methods,
 * we recommend using the wrapped instance for LLM calls only.
 * @param sdk An arbitrary SDK instance.
 * @param options LangSmith options.
 * @returns
 */
const wrapSDK = (sdk, options) => {
    return _wrapClient(sdk, options?.runName ?? sdk.constructor?.name, {
        client: options?.client,
    });
};
exports.wrapSDK = wrapSDK;
