import { CallbackManagerForLLMRun } from "@langchain/core/callbacks/manager";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { BaseMessage } from "@langchain/core/messages";
import { ChatResult } from "@langchain/core/outputs";
export declare class FakeChatModel extends BaseChatModel {
    _combineLLMOutput(): never[];
    _llmType(): string;
    _generate(messages: BaseMessage[], _?: this["ParsedCallOptions"], runManager?: CallbackManagerForLLMRun): Promise<ChatResult>;
}
