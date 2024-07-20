import { AIMessageChunk, BaseMessage } from "@langchain/core/messages";
import { ToolCall, ToolCallChunk } from "@langchain/core/messages/tool";
export declare function extractToolCalls(content: Record<string, any>[]): ToolCall[];
export declare function _convertLangChainToolCallToAnthropic(toolCall: ToolCall): Record<string, any>;
export declare function formatMessagesForAnthropic(messages: BaseMessage[]): {
    system?: string;
    messages: Record<string, unknown>[];
};
export declare function isAnthropicTool(tool: unknown): tool is Record<string, unknown>;
export declare function _makeMessageChunkFromAnthropicEvent(data: Record<string, any>, fields: {
    coerceContentToString?: boolean;
}): AIMessageChunk | null;
export declare function extractToolCallChunk(chunk: AIMessageChunk): ToolCallChunk | undefined;
export declare function extractToken(chunk: AIMessageChunk): string | undefined;
export declare function extractToolUseContent(chunk: AIMessageChunk, concatenatedChunks: AIMessageChunk | undefined): {
    toolUseContent: {
        id: string;
        type: "tool_use";
        name: string;
        input: Record<string, unknown>;
    } | undefined;
    concatenatedChunks: AIMessageChunk;
} | undefined;
export declare function _toolsInParams(params: Record<string, any>): boolean;
