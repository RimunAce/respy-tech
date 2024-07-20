import { test, expect } from "@jest/globals";
import { BaseRetriever } from "@langchain/core/retrievers";
import { BaseLLM } from "@langchain/core/language_models/llms";
import { Document } from "@langchain/core/documents";
import { PromptTemplate } from "@langchain/core/prompts";
import { MultiRetrievalQAChain } from "../multi_retrieval_qa.js";
class FakeRetrievers extends BaseRetriever {
    constructor(name) {
        super();
        Object.defineProperty(this, "lc_namespace", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.name = name;
    }
    async _getRelevantDocuments(query) {
        return [
            new Document({
                pageContent: `Test document ${query} ${this.name}`,
                metadata: {},
            }),
        ];
    }
}
let pickedRetriever;
class FakeLLM extends BaseLLM {
    _llmType() {
        return "fake";
    }
    async _generate(prompts, _) {
        function buildResponse(name) {
            return `\`\`\`\n{\n\t"destination": "${name}",\n\t"next_inputs": {\n\t\t"query": "<from ${name}>"\n\t}\n}\n\`\`\``;
        }
        const flatPrompt = prompts.join("\n");
        let response;
        if (flatPrompt.includes("Retriever prompt")) {
            response = flatPrompt;
        }
        else if (flatPrompt.includes("Helpful Answer")) {
            response = `Helpful Answer ${pickedRetriever}`;
        }
        else {
            // randomly choose 1 out of three responses
            const random = Math.random();
            if (random < 0.33) {
                pickedRetriever = "retriever1";
            }
            else if (random < 0.66) {
                pickedRetriever = "retriever2";
            }
            else {
                pickedRetriever = "retriever3";
            }
            response = buildResponse(pickedRetriever);
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
test("Test MultiRetrievalQAChain No Defaults With Retriever Prompts", async () => {
    const llm = new FakeLLM({});
    const retrieverNames = ["retriever1", "retriever2", "retriever3"];
    const retrieverDescriptions = [
        "description1",
        "description2",
        "description3",
    ];
    const retrievers = retrieverNames.map((name) => new FakeRetrievers(name));
    const retrieverPrompts = retrieverNames.map((name) => new PromptTemplate({
        template: `Retriever prompt for ${name} {context} {question}`,
        inputVariables: ["context", "question"],
    }));
    const multiRetrievalQAChain = MultiRetrievalQAChain.fromLLMAndRetrievers(llm, {
        retrieverNames,
        retrieverDescriptions,
        retrievers,
        retrieverPrompts,
    });
    const { text: result } = await multiRetrievalQAChain.invoke({
        input: "test input",
    });
    expect(result).toContain(pickedRetriever);
});
test("Test MultiRetrievalQAChain No Defaults No Retriever Prompts", async () => {
    const llm = new FakeLLM({});
    const retrieverNames = ["retriever1", "retriever2", "retriever3"];
    const retrieverDescriptions = [
        "description1",
        "description2",
        "description3",
    ];
    const retrievers = retrieverNames.map((name) => new FakeRetrievers(name));
    const multiRetrievalQAChain = MultiRetrievalQAChain.fromLLMAndRetrievers(llm, {
        retrieverNames,
        retrieverDescriptions,
        retrievers,
        retrievalQAChainOpts: {
            returnSourceDocuments: true,
        },
    });
    const { text: result, sourceDocuments } = await multiRetrievalQAChain.invoke({
        input: "test input",
    });
    const testDocs = ["retriever1", "retriever2", "retriever3"].map((name) => new Document({
        pageContent: `Test document <from ${name}> ${name}`,
        metadata: {},
    }));
    expect(testDocs).toContainEqual(sourceDocuments[0]);
    expect(result).toEqual(`Helpful Answer ${pickedRetriever}`);
});
