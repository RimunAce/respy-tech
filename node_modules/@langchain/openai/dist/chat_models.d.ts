import { type ClientOptions, OpenAI as OpenAIClient } from "openai";
import { CallbackManagerForLLMRun } from "@langchain/core/callbacks/manager";
import { AIMessageChunk, type BaseMessage } from "@langchain/core/messages";
import { ChatGenerationChunk, type ChatResult } from "@langchain/core/outputs";
import { type StructuredToolInterface } from "@langchain/core/tools";
import { BaseChatModel, LangSmithParams, type BaseChatModelParams } from "@langchain/core/language_models/chat_models";
import type { BaseFunctionCallOptions, BaseLanguageModelInput, StructuredOutputMethodOptions, StructuredOutputMethodParams } from "@langchain/core/language_models/base";
import { z } from "zod";
import { Runnable, RunnableToolLike } from "@langchain/core/runnables";
import type { AzureOpenAIInput, OpenAICallOptions, OpenAIChatInput, OpenAICoreRequestOptions, LegacyOpenAIInput } from "./types.js";
import { OpenAIToolChoice } from "./utils/openai.js";
export type { AzureOpenAIInput, OpenAICallOptions, OpenAIChatInput };
interface TokenUsage {
    completionTokens?: number;
    promptTokens?: number;
    totalTokens?: number;
}
interface OpenAILLMOutput {
    tokenUsage: TokenUsage;
}
type OpenAIRoleEnum = "system" | "assistant" | "user" | "function" | "tool";
export declare function messageToOpenAIRole(message: BaseMessage): OpenAIRoleEnum;
export interface ChatOpenAICallOptions extends OpenAICallOptions, BaseFunctionCallOptions {
    tools?: StructuredToolInterface[] | OpenAIClient.ChatCompletionTool[];
    tool_choice?: OpenAIToolChoice;
    promptIndex?: number;
    response_format?: {
        type: "json_object";
    };
    seed?: number;
    /**
     * Additional options to pass to streamed completions.
     * If provided takes precedence over "streamUsage" set at initialization time.
     */
    stream_options?: {
        /**
         * Whether or not to include token usage in the stream.
         * If set to `true`, this will include an additional
         * chunk at the end of the stream with the token usage.
         */
        include_usage: boolean;
    };
    /**
     * Whether or not to restrict the ability to
     * call multiple tools in one response.
     */
    parallel_tool_calls?: boolean;
}
/**
 * Wrapper around OpenAI large language models that use the Chat endpoint.
 *
 * To use you should have the `OPENAI_API_KEY` environment variable set.
 *
 * To use with Azure you should have the:
 * `AZURE_OPENAI_API_KEY`,
 * `AZURE_OPENAI_API_INSTANCE_NAME`,
 * `AZURE_OPENAI_API_DEPLOYMENT_NAME`
 * and `AZURE_OPENAI_API_VERSION` environment variables set.
 * `AZURE_OPENAI_BASE_PATH` is optional and will override `AZURE_OPENAI_API_INSTANCE_NAME` if you need to use a custom endpoint.
 *
 * @remarks
 * Any parameters that are valid to be passed to {@link
 * https://platform.openai.com/docs/api-reference/chat/create |
 * `openai.createChatCompletion`} can be passed through {@link modelKwargs}, even
 * if not explicitly available on this class.
 * @example
 * ```typescript
 * // Create a new instance of ChatOpenAI with specific temperature and model name settings
 * const model = new ChatOpenAI({
 *   temperature: 0.9,
 *   model: "ft:gpt-3.5-turbo-0613:{ORG_NAME}::{MODEL_ID}",
 * });
 *
 * // Invoke the model with a message and await the response
 * const message = await model.invoke("Hi there!");
 *
 * // Log the response to the console
 * console.log(message);
 *
 * ```
 */
export declare class ChatOpenAI<CallOptions extends ChatOpenAICallOptions = ChatOpenAICallOptions> extends BaseChatModel<CallOptions, AIMessageChunk> implements OpenAIChatInput, AzureOpenAIInput {
    static lc_name(): string;
    get callKeys(): string[];
    lc_serializable: boolean;
    get lc_secrets(): {
        [key: string]: string;
    } | undefined;
    get lc_aliases(): Record<string, string>;
    temperature: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
    n: number;
    logitBias?: Record<string, number>;
    modelName: string;
    model: string;
    modelKwargs?: OpenAIChatInput["modelKwargs"];
    stop?: string[];
    stopSequences?: string[];
    user?: string;
    timeout?: number;
    streaming: boolean;
    streamUsage: boolean;
    maxTokens?: number;
    logprobs?: boolean;
    topLogprobs?: number;
    openAIApiKey?: string;
    apiKey?: string;
    azureOpenAIApiVersion?: string;
    azureOpenAIApiKey?: string;
    azureADTokenProvider?: () => Promise<string>;
    azureOpenAIApiInstanceName?: string;
    azureOpenAIApiDeploymentName?: string;
    azureOpenAIBasePath?: string;
    organization?: string;
    __includeRawResponse?: boolean;
    protected client: OpenAIClient;
    protected clientConfig: ClientOptions;
    constructor(fields?: Partial<OpenAIChatInput> & Partial<AzureOpenAIInput> & BaseChatModelParams & {
        configuration?: ClientOptions & LegacyOpenAIInput;
    }, 
    /** @deprecated */
    configuration?: ClientOptions & LegacyOpenAIInput);
    getLsParams(options: this["ParsedCallOptions"]): LangSmithParams;
    bindTools(tools: (Record<string, unknown> | StructuredToolInterface | RunnableToolLike)[], kwargs?: Partial<CallOptions>): Runnable<BaseLanguageModelInput, AIMessageChunk, CallOptions>;
    /**
     * Get the parameters used to invoke the model
     */
    invocationParams(options?: this["ParsedCallOptions"], extra?: {
        streaming?: boolean;
    }): Omit<OpenAIClient.Chat.ChatCompletionCreateParams, "messages">;
    /** @ignore */
    _identifyingParams(): Omit<OpenAIClient.Chat.ChatCompletionCreateParams, "messages"> & {
        model_name: string;
    } & ClientOptions;
    _streamResponseChunks(messages: BaseMessage[], options: this["ParsedCallOptions"], runManager?: CallbackManagerForLLMRun): AsyncGenerator<ChatGenerationChunk>;
    /**
     * Get the identifying parameters for the model
     *
     */
    identifyingParams(): Omit<OpenAIClient.Chat.Completions.ChatCompletionCreateParams, "messages"> & {
        model_name: string;
    } & ClientOptions;
    /** @ignore */
    _generate(messages: BaseMessage[], options: this["ParsedCallOptions"], runManager?: CallbackManagerForLLMRun): Promise<ChatResult>;
    /**
     * Estimate the number of tokens a prompt will use.
     * Modified from: https://github.com/hmarr/openai-chat-tokens/blob/main/src/index.ts
     */
    private getEstimatedTokenCountFromPrompt;
    /**
     * Estimate the number of tokens an array of generations have used.
     */
    private getNumTokensFromGenerations;
    getNumTokensFromMessages(messages: BaseMessage[]): Promise<{
        totalCount: number;
        countPerMessage: number[];
    }>;
    /**
     * Calls the OpenAI API with retry logic in case of failures.
     * @param request The request to send to the OpenAI API.
     * @param options Optional configuration for the API call.
     * @returns The response from the OpenAI API.
     */
    completionWithRetry(request: OpenAIClient.Chat.ChatCompletionCreateParamsStreaming, options?: OpenAICoreRequestOptions): Promise<AsyncIterable<OpenAIClient.Chat.Completions.ChatCompletionChunk>>;
    completionWithRetry(request: OpenAIClient.Chat.ChatCompletionCreateParamsNonStreaming, options?: OpenAICoreRequestOptions): Promise<OpenAIClient.Chat.Completions.ChatCompletion>;
    protected _getClientOptions(options: OpenAICoreRequestOptions | undefined): OpenAICoreRequestOptions;
    _llmType(): string;
    /** @ignore */
    _combineLLMOutput(...llmOutputs: OpenAILLMOutput[]): OpenAILLMOutput;
    withStructuredOutput<RunOutput extends Record<string, any> = Record<string, any>>(outputSchema: StructuredOutputMethodParams<RunOutput, false> | z.ZodType<RunOutput> | Record<string, any>, config?: StructuredOutputMethodOptions<false>): Runnable<BaseLanguageModelInput, RunOutput>;
    withStructuredOutput<RunOutput extends Record<string, any> = Record<string, any>>(outputSchema: StructuredOutputMethodParams<RunOutput, true> | z.ZodType<RunOutput> | Record<string, any>, config?: StructuredOutputMethodOptions<true>): Runnable<BaseLanguageModelInput, {
        raw: BaseMessage;
        parsed: RunOutput;
    }>;
}
