import { type ClientOptions } from "openai";
import { type BaseLLMParams } from "@langchain/core/language_models/llms";
import { OpenAI } from "../llms.js";
import type { OpenAIInput, AzureOpenAIInput, OpenAICoreRequestOptions, LegacyOpenAIInput } from "../types.js";
export declare class AzureOpenAI extends OpenAI {
    get lc_aliases(): Record<string, string>;
    constructor(fields?: Partial<OpenAIInput> & {
        openAIApiKey?: string;
        openAIApiVersion?: string;
        openAIBasePath?: string;
        deploymentName?: string;
    } & Partial<AzureOpenAIInput> & BaseLLMParams & {
        configuration?: ClientOptions & LegacyOpenAIInput;
    });
    protected _getClientOptions(options: OpenAICoreRequestOptions | undefined): OpenAICoreRequestOptions;
    toJSON(): any;
}
