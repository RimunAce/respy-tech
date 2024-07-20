"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRunnableToolLike = exports.isStructuredTool = exports.convertToOpenAITool = exports.convertToOpenAIFunction = void 0;
const zod_to_json_schema_1 = require("zod-to-json-schema");
const base_js_1 = require("../runnables/base.cjs");
/**
 * Formats a `StructuredTool` or `RunnableToolLike` instance into a format
 * that is compatible with OpenAI function calling. It uses the `zodToJsonSchema`
 * function to convert the schema of the `StructuredTool` or `RunnableToolLike`
 * into a JSON schema, which is then used as the parameters for the OpenAI function.
 *
 * @param {StructuredToolInterface | RunnableToolLike} tool The tool to convert to an OpenAI function.
 * @returns {FunctionDefinition} The inputted tool in OpenAI function format.
 */
function convertToOpenAIFunction(tool) {
    return {
        name: tool.name,
        description: tool.description,
        parameters: (0, zod_to_json_schema_1.zodToJsonSchema)(tool.schema),
    };
}
exports.convertToOpenAIFunction = convertToOpenAIFunction;
/**
 * Formats a `StructuredTool` or `RunnableToolLike` instance into a
 * format that is compatible with OpenAI tool calling. It uses the
 * `zodToJsonSchema` function to convert the schema of the `StructuredTool`
 * or `RunnableToolLike` into a JSON schema, which is then used as the
 * parameters for the OpenAI tool.
 *
 * @param {StructuredToolInterface | Record<string, any> | RunnableToolLike} tool The tool to convert to an OpenAI tool.
 * @returns {ToolDefinition} The inputted tool in OpenAI tool format.
 */
function convertToOpenAITool(
// eslint-disable-next-line @typescript-eslint/no-explicit-any
tool) {
    if (isStructuredTool(tool) || isRunnableToolLike(tool)) {
        return {
            type: "function",
            function: convertToOpenAIFunction(tool),
        };
    }
    return tool;
}
exports.convertToOpenAITool = convertToOpenAITool;
/**
 * Confirm whether the inputted tool is an instance of `StructuredToolInterface`.
 *
 * @param {StructuredToolInterface | Record<string, any> | undefined} tool The tool to check if it is an instance of `StructuredToolInterface`.
 * @returns {tool is StructuredToolInterface} Whether the inputted tool is an instance of `StructuredToolInterface`.
 */
function isStructuredTool(
// eslint-disable-next-line @typescript-eslint/no-explicit-any
tool) {
    return (tool !== undefined &&
        Array.isArray(tool.lc_namespace));
}
exports.isStructuredTool = isStructuredTool;
/**
 * Confirm whether the inputted tool is an instance of `RunnableToolLike`.
 *
 * @param {unknown | undefined} tool The tool to check if it is an instance of `RunnableToolLike`.
 * @returns {tool is RunnableToolLike} Whether the inputted tool is an instance of `RunnableToolLike`.
 */
function isRunnableToolLike(tool) {
    return (tool !== undefined &&
        base_js_1.Runnable.isRunnable(tool) &&
        "lc_name" in tool.constructor &&
        typeof tool.constructor.lc_name === "function" &&
        tool.constructor.lc_name() === "RunnableToolLike");
}
exports.isRunnableToolLike = isRunnableToolLike;
