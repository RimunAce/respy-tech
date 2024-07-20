import { BaseChatModel, type BaseChatModelParams } from "@langchain/core/language_models/chat_models";
import { type BaseMessage } from "@langchain/core/messages";
import { type ChatResult } from "@langchain/core/outputs";
export declare const DEFAULT_MODEL = "meta-llama/Meta-Llama-3-70B-Instruct";
export type DeepInfraMessageRole = "system" | "assistant" | "user";
export declare const API_BASE_URL = "https://api.deepinfra.com/v1/openai/chat/completions";
export declare const ENV_VARIABLE_API_KEY = "DEEPINFRA_API_TOKEN";
interface DeepInfraMessage {
    role: DeepInfraMessageRole;
    content: string;
}
interface ChatCompletionRequest {
    model: string;
    messages?: DeepInfraMessage[];
    stream?: boolean;
    max_tokens?: number | null;
    temperature?: number | null;
}
export interface ChatDeepInfraParams {
    model: string;
    apiKey?: string;
    temperature?: number;
    maxTokens?: number;
}
export declare class ChatDeepInfra extends BaseChatModel implements ChatDeepInfraParams {
    static lc_name(): string;
    get callKeys(): string[];
    apiKey?: string;
    model: string;
    apiUrl: string;
    maxTokens?: number;
    temperature?: number;
    constructor(fields?: Partial<ChatDeepInfraParams> & BaseChatModelParams);
    invocationParams(): Omit<ChatCompletionRequest, "messages">;
    identifyingParams(): Omit<ChatCompletionRequest, "messages">;
    _generate(messages: BaseMessage[], options?: this["ParsedCallOptions"]): Promise<ChatResult>;
    completionWithRetry(request: ChatCompletionRequest, stream: boolean, signal?: AbortSignal): Promise<any>;
    _llmType(): string;
}
export {};
