import { OpenAI } from "openai";
import type { APIPromise } from "openai/core";
import type { Client, RunTreeConfig } from "../index.js";
type OpenAIType = {
    chat: {
        completions: {
            create: (...args: any[]) => any;
        };
    };
    completions: {
        create: (...args: any[]) => any;
    };
};
type ExtraRunTreeConfig = Pick<Partial<RunTreeConfig>, "name" | "metadata" | "tags">;
type PatchedOpenAIClient<T extends OpenAIType> = T & {
    chat: T["chat"] & {
        completions: T["chat"]["completions"] & {
            create: {
                (arg: OpenAI.ChatCompletionCreateParamsStreaming, arg2?: OpenAI.RequestOptions & {
                    langsmithExtra?: ExtraRunTreeConfig;
                }): APIPromise<AsyncGenerator<OpenAI.ChatCompletionChunk>>;
            } & {
                (arg: OpenAI.ChatCompletionCreateParamsNonStreaming, arg2?: OpenAI.RequestOptions & {
                    langsmithExtra?: ExtraRunTreeConfig;
                }): APIPromise<OpenAI.ChatCompletionChunk>;
            };
        };
    };
    completions: T["completions"] & {
        create: {
            (arg: OpenAI.CompletionCreateParamsStreaming, arg2?: OpenAI.RequestOptions & {
                langsmithExtra?: ExtraRunTreeConfig;
            }): APIPromise<AsyncGenerator<OpenAI.Completion>>;
        } & {
            (arg: OpenAI.CompletionCreateParamsNonStreaming, arg2?: OpenAI.RequestOptions & {
                langsmithExtra?: ExtraRunTreeConfig;
            }): APIPromise<OpenAI.Completion>;
        };
    };
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
export declare const wrapOpenAI: <T extends OpenAIType>(openai: T, options?: Partial<RunTreeConfig>) => PatchedOpenAIClient<T>;
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
export declare const wrapSDK: <T extends object>(sdk: T, options?: {
    client?: Client;
    runName?: string;
}) => T;
export {};
