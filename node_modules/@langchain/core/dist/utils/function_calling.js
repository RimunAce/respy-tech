import { zodToJsonSchema } from "zod-to-json-schema";
import { Runnable } from "../runnables/base.js";
/**
 * Formats a `StructuredTool` or `RunnableToolLike` instance into a format
 * that is compatible with OpenAI function calling. It uses the `zodToJsonSchema`
 * function to convert the schema of the `StructuredTool` or `RunnableToolLike`
 * into a JSON schema, which is then used as the parameters for the OpenAI function.
 *
 * @param {StructuredToolInterface | RunnableToolLike} tool The tool to convert to an OpenAI function.
 * @returns {FunctionDefinition} The inputted tool in OpenAI function format.
 */
export function convertToOpenAIFunction(tool) {
    return {
        name: tool.name,
        description: tool.description,
        parameters: zodToJsonSchema(tool.schema),
    };
}
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
export function convertToOpenAITool(
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
/**
 * Confirm whether the inputted tool is an instance of `StructuredToolInterface`.
 *
 * @param {StructuredToolInterface | Record<string, any> | undefined} tool The tool to check if it is an instance of `StructuredToolInterface`.
 * @returns {tool is StructuredToolInterface} Whether the inputted tool is an instance of `StructuredToolInterface`.
 */
export function isStructuredTool(
// eslint-disable-next-line @typescript-eslint/no-explicit-any
tool) {
    return (tool !== undefined &&
        Array.isArray(tool.lc_namespace));
}
/**
 * Confirm whether the inputted tool is an instance of `RunnableToolLike`.
 *
 * @param {unknown | undefined} tool The tool to check if it is an instance of `RunnableToolLike`.
 * @returns {tool is RunnableToolLike} Whether the inputted tool is an instance of `RunnableToolLike`.
 */
export function isRunnableToolLike(tool) {
    return (tool !== undefined &&
        Runnable.isRunnable(tool) &&
        "lc_name" in tool.constructor &&
        typeof tool.constructor.lc_name === "function" &&
        tool.constructor.lc_name() === "RunnableToolLike");
}
