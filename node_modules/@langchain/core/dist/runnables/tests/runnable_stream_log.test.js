/* eslint-disable no-promise-executor-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { test } from "@jest/globals";
import { ChatPromptTemplate, HumanMessagePromptTemplate, PromptTemplate, SystemMessagePromptTemplate, } from "../../prompts/index.js";
import { Document } from "../../documents/document.js";
import { RunnableSequence, RunnableMap } from "../base.js";
import { FakeLLM, FakeChatModel, FakeRetriever, } from "../../utils/testing/index.js";
test("Runnable streamLog method", async () => {
    const promptTemplate = PromptTemplate.fromTemplate("{input}");
    const llm = new FakeLLM({});
    const runnable = promptTemplate.pipe(llm);
    const result = await runnable.streamLog({ input: "Hello world!" });
    let finalState;
    for await (const chunk of result) {
        if (finalState === undefined) {
            finalState = chunk;
        }
        else {
            finalState = finalState.concat(chunk);
        }
    }
    expect(finalState.state.final_output).toEqual({
        output: "Hello world!",
    });
});
test("Runnable streamLog method with a more complicated sequence", async () => {
    const promptTemplate = ChatPromptTemplate.fromMessages([
        SystemMessagePromptTemplate.fromTemplate(`You are a nice assistant.`),
        HumanMessagePromptTemplate.fromTemplate(`Context:\n{documents}\n\nQuestion:\n{question}`),
    ]);
    const llm = new FakeChatModel({});
    const retrieverOutputDocs = [
        new Document({ pageContent: "foo" }),
        new Document({ pageContent: "bar" }),
    ];
    const inputs = {
        question: (input) => input,
        documents: RunnableSequence.from([
            new FakeRetriever({
                output: retrieverOutputDocs,
            }),
            (docs) => JSON.stringify(docs),
        ]).withConfig({ runName: "CUSTOM_NAME" }),
        extraField: new FakeLLM({
            response: "testing",
        }).withConfig({ tags: ["only_one"] }),
    };
    const runnable = new RunnableMap({
        steps: inputs,
    })
        .pipe(promptTemplate)
        .pipe(llm);
    const stream = await runnable.streamLog("Do you know the Muffin Man?", {}, {
        includeTags: ["only_one"],
        includeNames: ["CUSTOM_NAME"],
    });
    let finalState;
    for await (const chunk of stream) {
        if (finalState === undefined) {
            finalState = chunk;
        }
        else {
            finalState = finalState.concat(chunk);
        }
    }
    expect(finalState.state.logs.FakeLLM).toBeDefined();
    expect(finalState.state.logs.FakeLLM.final_output.generations[0][0]
        .text).toEqual("testing");
    expect(finalState.state.logs.CUSTOM_NAME).toBeDefined();
    expect(finalState.state.logs.CUSTOM_NAME.final_output.output).toEqual(JSON.stringify(retrieverOutputDocs));
});
