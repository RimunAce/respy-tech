"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const openai_1 = require("@langchain/openai");
const documents_1 = require("@langchain/core/documents");
const llm_js_1 = require("./llm.cjs");
const graph_document_js_1 = require("../../graphs/graph_document.cjs");
test.skip("convertToGraphDocuments", async () => {
    const model = new openai_1.ChatOpenAI({
        temperature: 0,
        modelName: "gpt-4-turbo-preview",
    });
    const llmGraphTransformer = new llm_js_1.LLMGraphTransformer({
        llm: model,
    });
    const result = await llmGraphTransformer.convertToGraphDocuments([
        new documents_1.Document({ pageContent: "Elon Musk is suing OpenAI" }),
    ]);
    console.log(result);
});
test("convertToGraphDocuments with allowed", async () => {
    const model = new openai_1.ChatOpenAI({
        temperature: 0,
        modelName: "gpt-4-turbo-preview",
    });
    const llmGraphTransformer = new llm_js_1.LLMGraphTransformer({
        llm: model,
        allowedNodes: ["PERSON", "ORGANIZATION"],
        allowedRelationships: ["SUES"],
    });
    const result = await llmGraphTransformer.convertToGraphDocuments([
        new documents_1.Document({ pageContent: "Elon Musk is suing OpenAI" }),
    ]);
    console.log(JSON.stringify(result));
    expect(result).toEqual([
        new graph_document_js_1.GraphDocument({
            nodes: [
                new graph_document_js_1.Node({ id: "Elon Musk", type: "Person" }),
                new graph_document_js_1.Node({ id: "OpenAI", type: "Organization" }),
            ],
            relationships: [
                new graph_document_js_1.Relationship({
                    source: new graph_document_js_1.Node({ id: "Elon Musk", type: "Person" }),
                    target: new graph_document_js_1.Node({ id: "OpenAI", type: "Organization" }),
                    type: "SUES",
                }),
            ],
            source: new documents_1.Document({
                pageContent: "Elon Musk is suing OpenAI",
                metadata: {},
            }),
        }),
    ]);
});
test("convertToGraphDocuments with allowed lowercased", async () => {
    const model = new openai_1.ChatOpenAI({
        temperature: 0,
        modelName: "gpt-4-turbo-preview",
    });
    const llmGraphTransformer = new llm_js_1.LLMGraphTransformer({
        llm: model,
        allowedNodes: ["Person", "Organization"],
        allowedRelationships: ["SUES"],
    });
    const result = await llmGraphTransformer.convertToGraphDocuments([
        new documents_1.Document({ pageContent: "Elon Musk is suing OpenAI" }),
    ]);
    console.log(JSON.stringify(result));
    expect(result).toEqual([
        new graph_document_js_1.GraphDocument({
            nodes: [
                new graph_document_js_1.Node({ id: "Elon Musk", type: "Person" }),
                new graph_document_js_1.Node({ id: "OpenAI", type: "Organization" }),
            ],
            relationships: [
                new graph_document_js_1.Relationship({
                    source: new graph_document_js_1.Node({ id: "Elon Musk", type: "Person" }),
                    target: new graph_document_js_1.Node({ id: "OpenAI", type: "Organization" }),
                    type: "SUES",
                }),
            ],
            source: new documents_1.Document({
                pageContent: "Elon Musk is suing OpenAI",
                metadata: {},
            }),
        }),
    ]);
});
