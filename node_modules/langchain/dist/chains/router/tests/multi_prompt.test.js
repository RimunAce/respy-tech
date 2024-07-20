import { test, expect } from "@jest/globals";
import { BaseLLM } from "@langchain/core/language_models/llms";
import { MultiPromptChain } from "../multi_prompt.js";
let pickedPrompt;
class FakeLLM extends BaseLLM {
    _llmType() {
        return "fake";
    }
    async _generate(prompts, _) {
        function buildResponse(name) {
            return `\`\`\`\n{\n\t"destination": "${name}",\n\t"next_inputs": {\n\t\t"input": "<from ${name}>"\n\t}\n}\n\`\`\``;
        }
        const flatPrompt = prompts.join("\n");
        let response;
        if (flatPrompt.includes("prompt template")) {
            const splitted = flatPrompt.split(" ");
            response = `${splitted[splitted.length - 2]} ${splitted[splitted.length - 1]}`;
        }
        else {
            // randomly choose 1 out of three responses
            const random = Math.random();
            if (random < 0.33) {
                pickedPrompt = "prompt1";
            }
            else if (random < 0.66) {
                pickedPrompt = "prompt2";
            }
            else {
                pickedPrompt = "prompt3";
            }
            response = buildResponse(pickedPrompt);
        }
        return {
            generations: [
                [
                    {
                        text: response,
                    },
                ],
            ],
        };
    }
}
test("Test MultiPromptChain", async () => {
    const llm = new FakeLLM({});
    const promptNames = ["prompt1", "prompt2", "prompt3"];
    const promptDescriptions = ["description1", "description2", "description3"];
    const promptTemplates = [
        "prompt template1 {input}",
        "prompt template2 {input}",
        "prompt template3 {input}",
    ];
    const multiPromptChain = MultiPromptChain.fromLLMAndPrompts(llm, {
        promptNames,
        promptDescriptions,
        promptTemplates,
    });
    const { text: result } = await multiPromptChain.invoke({
        input: "Test input",
    });
    expect(result).toEqual(`<from ${pickedPrompt}>`);
});
