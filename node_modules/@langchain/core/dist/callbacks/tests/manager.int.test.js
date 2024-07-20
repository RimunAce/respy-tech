/* eslint-disable no-process-env */
import { test } from "@jest/globals";
import { PromptTemplate } from "../../prompts/prompt.js";
import { FakeLLM } from "../../utils/testing/index.js";
import { traceAsGroup, TraceGroup } from "../manager.js";
import { StringOutputParser } from "../../output_parsers/string.js";
test("Test grouping traces", async () => {
    process.env.LANGCHAIN_TRACING_V2 = "true";
    const chain = PromptTemplate.fromTemplate("hello world")
        .pipe(new FakeLLM({}))
        .pipe(new StringOutputParser());
    const nextChain = PromptTemplate.fromTemplate("This is the day {input2}")
        .pipe(new FakeLLM({}))
        .pipe(new StringOutputParser());
    const result = await traceAsGroup({ name: "my_chain_group" }, async (manager, arg1, { chain, nextChain }) => {
        const result = await chain.invoke({ input: arg1 }, manager);
        const nextResult = await nextChain.invoke({ input2: result }, manager);
        return nextResult;
    }, "I'm arg1", { chain, nextChain });
    console.log(result);
});
test("Test TraceGroup object", async () => {
    const traceGroup = new TraceGroup("my_trace_group");
    const childManager = await traceGroup.start({ input: "Hello, World" });
    const prompt = PromptTemplate.fromTemplate("Hello, world!");
    const result = await prompt.invoke({}, { callbacks: childManager });
    await traceGroup.end({ value: result.value });
    expect(result.value).toBe("Hello, world!");
});
