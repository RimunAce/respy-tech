import { type ClientOptions } from "openai";
import { LangSmithParams, type BaseChatModelParams } from "@langchain/core/language_models/chat_models";
import { ChatOpenAI } from "../chat_models.js";
import { AzureOpenAIInput, LegacyOpenAIInput, OpenAIChatInput, OpenAICoreRequestOptions } from "../types.js";
export declare class AzureChatOpenAI extends ChatOpenAI {
    _llmType(): string;
    get lc_aliases(): Record<string, string>;
    constructor(fields?: Partial<OpenAIChatInput> & Partial<AzureOpenAIInput> & {
        openAIApiKey?: string;
        openAIApiVersion?: string;
        openAIBasePath?: string;
        deploymentName?: string;
    } & BaseChatModelParams & {
        configuration?: ClientOptions & LegacyOpenAIInput;
    });
    getLsParams(options: this["ParsedCallOptions"]): LangSmithParams;
    protected _getClientOptions(options: OpenAICoreRequestOptions | undefined): OpenAICoreRequestOptions;
    toJSON(): any;
}
