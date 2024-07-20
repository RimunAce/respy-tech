import { test, expect } from "@jest/globals";
import { stringify } from "yaml";
import { z } from "zod";
import { RunnableSequence } from "@langchain/core/runnables";
import { OpenAI, ChatOpenAI } from "@langchain/openai";
import { HumanMessagePromptTemplate, SystemMessagePromptTemplate, ChatPromptTemplate, FewShotPromptTemplate, PromptTemplate, } from "@langchain/core/prompts";
import { LengthBasedExampleSelector } from "@langchain/core/example_selectors";
import { Serializable } from "@langchain/core/load/serializable";
import { ConsoleCallbackHandler } from "@langchain/core/tracers/console";
import { CommaSeparatedListOutputParser } from "@langchain/core/output_parsers";
import { LLMChain } from "../../chains/llm_chain.js";
import { initializeAgentExecutorWithOptions } from "../../agents/initialize.js";
import { Calculator } from "../../util/testing/tools/calculator.js";
import { RequestsGetTool } from "../../tools/requests.js";
import { JsonListKeysTool, JsonSpec } from "../../tools/json.js";
import { AgentExecutor } from "../../agents/executor.js";
import { StructuredOutputParser } from "../../output_parsers/structured.js";
import { RegexParser } from "../../output_parsers/regex.js";
import { load } from "../index.js";
test("serialize + deserialize custom classes", async () => {
    class Person extends Serializable {
        get lc_secrets() {
            return { apiKey: "PERSON_API_KEY" };
        }
        get lc_attributes() {
            return { hello: this.hello };
        }
        constructor(fields) {
            super(fields);
            Object.defineProperty(this, "lc_namespace", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: ["langchain", "tests"]
            });
            Object.defineProperty(this, "lc_serializable", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: true
            });
            Object.defineProperty(this, "hello", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: 3
            });
        }
    }
    class SpecialPerson extends Person {
        get lc_secrets() {
            return {
                anotherApiKey: "SPECIAL_PERSON_API_KEY",
                inherited: "SPECIAL_PERSON_INHERITED_API_KEY",
                "nested.api.key": "SPECIAL_PERSON_NESTED_API_KEY",
            };
        }
        get lc_attributes() {
            return { by: this.bye };
        }
        constructor(fields) {
            super(fields);
            Object.defineProperty(this, "bye", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: 4
            });
            Object.defineProperty(this, "inherited", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            Object.defineProperty(this, "nested", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            this.inherited = fields.inehrited ?? "i-key";
            this.nested = fields.nested ?? { api: { key: "n-key" } };
        }
    }
    const person = new Person({ aField: "hello", apiKey: "a-key" });
    const lc_argumentsBefore = person.lc_kwargs;
    const str = JSON.stringify(person, null, 2);
    expect(person.lc_kwargs).toEqual(lc_argumentsBefore);
    expect(stringify(JSON.parse(str))).toMatchSnapshot();
    const person2 = await load(str, {
        PERSON_API_KEY: "a-key",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }, {
        "langchain/tests": { Person },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    });
    expect(person2).toBeInstanceOf(Person);
    expect(JSON.stringify(person2, null, 2)).toBe(str);
    const sperson = new SpecialPerson({
        aField: "hello",
        apiKey: "a-key",
        anotherApiKey: "b-key",
        // We explicitly do not provide the inherited and nested key
        // to test that it has been extracted during serialisation
        // simulating obtaining value from environment value
        // inherited: "i-key",
        // nested: { api: { key: "n-key" } },
    });
    const sstr = JSON.stringify(sperson, null, 2);
    expect(stringify(JSON.parse(sstr))).toMatchSnapshot();
    const sperson2 = await load(sstr, {
        PERSON_API_KEY: "a-key",
        SPECIAL_PERSON_API_KEY: "b-key",
        SPECIAL_PERSON_NESTED_API_KEY: "n-key",
        SPECIAL_PERSON_INHERITED_API_KEY: "i-key",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }, {
        "langchain/tests": { SpecialPerson },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    });
    expect(sperson2).toBeInstanceOf(SpecialPerson);
    expect(JSON.stringify(sperson2, null, 2)).toBe(sstr);
});
test("serialize + deserialize llm", async () => {
    // eslint-disable-next-line no-process-env
    process.env.OPENAI_API_KEY = "openai-key";
    const llm = new OpenAI({
        temperature: 0.5,
        modelName: "davinci",
    });
    llm.temperature = 0.7;
    const lc_argumentsBefore = llm.lc_kwargs;
    const str = JSON.stringify(llm, null, 2);
    expect(llm.lc_kwargs).toEqual(lc_argumentsBefore);
    expect(stringify(JSON.parse(str))).toMatchSnapshot();
    expect(JSON.parse(str).kwargs.temperature).toBe(0.7);
    expect(JSON.parse(str).kwargs.model).toBe("davinci");
    expect(JSON.parse(str).kwargs.openai_api_key.type).toBe("secret");
    // Accept secret in secret map
    const llm2 = await load(str, {
        OPENAI_API_KEY: "openai-key",
    });
    expect(llm2).toBeInstanceOf(OpenAI);
    expect(JSON.stringify(llm2, null, 2)).toBe(str);
    // Accept secret as env var
    const llm3 = await load(str);
    expect(llm3).toBeInstanceOf(OpenAI);
    expect(llm.openAIApiKey).toBe(llm3.openAIApiKey);
    expect(JSON.stringify(llm3, null, 2)).toBe(str);
});
test("serialize + deserialize llm chain string prompt", async () => {
    const llm = new OpenAI({
        temperature: 0.5,
        modelName: "davinci",
        openAIApiKey: "openai-key",
        verbose: true,
        callbacks: [
            new ConsoleCallbackHandler(),
            {
                handleLLMEnd(output) {
                    console.log(output);
                },
            },
        ],
    });
    const prompt = PromptTemplate.fromTemplate("Hello, {name}!");
    const chain = new LLMChain({ llm, prompt });
    const str = JSON.stringify(chain, null, 2);
    expect(JSON.parse(str).kwargs.callbacks).toBeUndefined();
    expect(JSON.parse(str).kwargs.verbose).toBeUndefined();
    expect(stringify(JSON.parse(str))).toMatchSnapshot();
    const chain2 = await load(str, {
        OPENAI_API_KEY: "openai-key",
    });
    expect(chain2).toBeInstanceOf(LLMChain);
    expect(JSON.stringify(chain2, null, 2)).toBe(str);
});
test("serialize + deserialize with new and old ids", async () => {
    const prompt = PromptTemplate.fromTemplate("Hello, {name}!");
    const strWithNewId = JSON.stringify(prompt, null, 2);
    expect(stringify(JSON.parse(strWithNewId))).toMatchSnapshot();
    expect(JSON.parse(strWithNewId).id).toEqual([
        "langchain_core",
        "prompts",
        "prompt",
        "PromptTemplate",
    ]);
    const strWithOldId = JSON.stringify({
        ...JSON.parse(strWithNewId),
        id: ["langchain", "prompts", "prompt", "PromptTemplate"],
    });
    const prompt2 = await load(strWithOldId);
    expect(prompt2).toBeInstanceOf(PromptTemplate);
    const prompt3 = await load(strWithNewId);
    expect(prompt3).toBeInstanceOf(PromptTemplate);
});
test("serialize + deserialize runnable sequence with new and old ids", async () => {
    const runnable = RunnableSequence.from([
        ChatPromptTemplate.fromTemplate("hi there"),
        new ChatOpenAI(),
    ]);
    const strWithNewId = JSON.stringify(runnable, null, 2);
    expect(stringify(JSON.parse(strWithNewId))).toMatchSnapshot();
    expect(JSON.parse(strWithNewId).id).toEqual([
        "langchain_core",
        "runnables",
        "RunnableSequence",
    ]);
    const strWithOldId = JSON.stringify({
        ...JSON.parse(strWithNewId),
        id: ["langchain", "schema", "runnable", "RunnableSequence"],
    });
    const runnable2 = await load(strWithOldId);
    expect(runnable2).toBeInstanceOf(RunnableSequence);
    const runnable3 = await load(strWithNewId);
    expect(runnable3).toBeInstanceOf(RunnableSequence);
});
test("serialize + deserialize llm chain chat prompt", async () => {
    // eslint-disable-next-line no-process-env
    process.env.OPENAI_API_KEY = undefined;
    const llm = new ChatOpenAI({
        temperature: 0.5,
        modelName: "gpt-4",
        streaming: true,
        azureOpenAIApiKey: "openai-key",
        azureOpenAIApiInstanceName: "openai-instance",
        azureOpenAIApiDeploymentName: "openai-deployment",
        azureOpenAIApiVersion: "openai-version",
        prefixMessages: [
            {
                role: "system",
                content: "You're a nice assistant",
            },
        ],
    });
    const prompt = ChatPromptTemplate.fromMessages([
        SystemMessagePromptTemplate.fromTemplate("You are talking to {name}."),
        HumanMessagePromptTemplate.fromTemplate("Hello, nice model."),
    ]);
    const chain = new LLMChain({ llm, prompt });
    const str = JSON.stringify(chain, null, 2);
    expect(stringify(JSON.parse(str))).toMatchSnapshot();
    const chain2 = await load(str, {
        AZURE_OPENAI_API_KEY: "openai-key",
    });
    expect(chain2).toBeInstanceOf(LLMChain);
    expect(JSON.stringify(chain2, null, 2)).toBe(str);
});
test("serialize + deserialize llm chain few shot prompt w/ examples", async () => {
    const llm = new OpenAI({
        temperature: 0.5,
        modelName: "davinci",
        openAIApiKey: "openai-key",
        callbacks: [new ConsoleCallbackHandler()],
    });
    const prompt = new FewShotPromptTemplate({
        examples: [{ yo: "1" }, { yo: "2" }],
        prefix: "You are a nice assistant",
        examplePrompt: PromptTemplate.fromTemplate("An example about {yo}"),
        suffix: "My name is {name}",
        inputVariables: ["yo", "name"],
    });
    const chain = new LLMChain({ llm, prompt });
    const str = JSON.stringify(chain, null, 2);
    expect(stringify(JSON.parse(str))).toMatchSnapshot();
    await expect(load(str, {
        OPENAI_API_KEY: "openai-key",
    })).rejects.toThrowError('Trying to load an object that doesn\'t implement serialization: $.kwargs.prompt -> {"lc":1,"type":"not_implemented","id":["langchain_core","prompts","few_shot","FewShotPromptTemplate"]}');
});
test("serialize + deserialize llm chain few shot prompt w/ selector", async () => {
    const llm = new OpenAI({
        temperature: 0.5,
        modelName: "davinci",
        openAIApiKey: "openai-key",
    });
    const examplePrompt = PromptTemplate.fromTemplate("An example about {yo}");
    const prompt = new FewShotPromptTemplate({
        exampleSelector: await LengthBasedExampleSelector.fromExamples([{ yo: "1" }, { yo: "2" }], { examplePrompt }),
        prefix: "You are a nice assistant",
        examplePrompt,
        suffix: "My name is {name}",
        inputVariables: ["yo", "name"],
    });
    const chain = new LLMChain({ llm, prompt });
    const str = JSON.stringify(chain, null, 2);
    expect(stringify(JSON.parse(str))).toMatchSnapshot();
    await expect(load(str, {
        OPENAI_API_KEY: "openai-key",
    })).rejects.toThrow('Trying to load an object that doesn\'t implement serialization: $.kwargs.prompt -> {"lc":1,"type":"not_implemented","id":["langchain_core","prompts","few_shot","FewShotPromptTemplate"]}');
});
test("serialize + deserialize llmchain with list output parser", async () => {
    const llm = new OpenAI({
        temperature: 0.5,
        modelName: "davinci",
        openAIApiKey: "openai-key",
        callbacks: [new ConsoleCallbackHandler()],
    });
    const prompt = PromptTemplate.fromTemplate("An example about {yo} {format_instructions}");
    const outputParser = new CommaSeparatedListOutputParser();
    const chain = new LLMChain({ llm, prompt, outputParser });
    const str = JSON.stringify(chain, null, 2);
    expect(stringify(JSON.parse(str))).toMatchSnapshot();
    const chain2 = await load(str, {
        OPENAI_API_KEY: "openai-key",
    });
    expect(chain2).toBeInstanceOf(LLMChain);
    expect(JSON.stringify(chain2, null, 2)).toBe(str);
    expect(await chain2.outputParser?.parseResult([{ text: "a, b, c" }])).toEqual(["a", "b", "c"]);
});
test("serialize + deserialize llmchain with regex output parser", async () => {
    const llm = new OpenAI({
        temperature: 0.5,
        modelName: "davinci",
        openAIApiKey: "openai-key",
        callbacks: [new ConsoleCallbackHandler()],
    });
    const prompt = PromptTemplate.fromTemplate("An example about {yo} {format_instructions}");
    const outputParser = new RegexParser({
        regex: /Confidence: (A|B|C), Explanation: (.*)/,
        outputKeys: ["confidence", "explanation"],
    });
    const chain = new LLMChain({ llm, prompt, outputParser });
    const str = JSON.stringify(chain, null, 2);
    expect(stringify(JSON.parse(str))).toMatchSnapshot();
    const chain2 = await load(str, {
        OPENAI_API_KEY: "openai-key",
    });
    expect(chain2).toBeInstanceOf(LLMChain);
    expect(JSON.stringify(chain2, null, 2)).toBe(str);
    expect(await chain2.outputParser?.parseResult([
        {
            text: "Confidence: A, Explanation: Because it is the capital of France.",
        },
    ])).toEqual({
        confidence: "A",
        explanation: "Because it is the capital of France.",
    });
});
test("serialize + deserialize llmchain with struct output parser throws", async () => {
    const llm = new OpenAI({
        temperature: 0.5,
        modelName: "davinci",
        openAIApiKey: "openai-key",
        callbacks: [new ConsoleCallbackHandler({})],
    });
    const prompt = PromptTemplate.fromTemplate("An example about {yo} {format_instructions}");
    const outputParser = new StructuredOutputParser(z.object({
        a: z.string(),
    }));
    const chain = new LLMChain({ llm, prompt, outputParser });
    const str = JSON.stringify(chain, null, 2);
    expect(stringify(JSON.parse(str))).toMatchSnapshot();
    await expect(load(str, {
        OPENAI_API_KEY: "openai-key",
    })).rejects.toThrow('Trying to load an object that doesn\'t implement serialization: $.kwargs.output_parser -> {"lc":1,"type":"not_implemented","id":["langchain","output_parsers","structured","StructuredOutputParser"]}');
});
test.skip("serialize + deserialize agent", async () => {
    const llm = new ChatOpenAI({
        temperature: 0,
        modelName: "gpt-4",
        openAIApiKey: "openai-key",
    });
    const executor = await initializeAgentExecutorWithOptions([
        new Calculator(),
        new RequestsGetTool(),
        new JsonListKeysTool(new JsonSpec({ a: "b" })),
    ], llm, {
        agentType: "chat-conversational-react-description",
    });
    const str = JSON.stringify(executor, null, 2);
    expect(stringify(JSON.parse(str))).toMatchSnapshot();
    const executor2 = await load(str, { OPENAI_API_KEY: "openai-key" }, {
        "langchain/tools/calculator": { Calculator },
    });
    expect(executor2).toBeInstanceOf(AgentExecutor);
    expect(JSON.stringify(executor2, null, 2)).toBe(str);
});
test("override name of objects when serialising", async () => {
    const llm = new OpenAI({ temperature: 0.5, apiKey: "openai-key" });
    const str = JSON.stringify(llm, null, 2);
    class MangledName extends OpenAI {
    }
    const llm2 = await load(str, { OPENAI_API_KEY: "openai-key" }, { "langchain/llms/openai": { OpenAI: MangledName } });
    expect(JSON.stringify(llm2, null, 2)).toBe(str);
});
test("Should load traces even if the constructor name changes (minified environments)", async () => {
    const llm = new OpenAI({ temperature: 0.5, apiKey: "openai-key" });
    Object.defineProperty(llm.constructor, "name", {
        value: "x",
    });
    const str = JSON.stringify(llm, null, 2);
    console.log(str);
    const llm2 = await load(str, { COHERE_API_KEY: "cohere-key" }, { "langchain/llms/openai": { OpenAI } });
    console.log(JSON.stringify(llm2, null, 2));
    expect(JSON.stringify(llm2, null, 2)).toBe(str);
});
test("Should load a real-world serialized chain", async () => {
    const serializedValue = `{"lc": 1, "type": "constructor", "id": ["langchain_core", "runnables", "RunnableSequence"], "kwargs": {"first": {"lc": 1, "type": "constructor", "id": ["langchain_core", "runnables", "RunnableParallel"], "kwargs": {"steps": {"equation_statement": {"lc": 1, "type": "constructor", "id": ["langchain_core", "runnables", "RunnablePassthrough"], "kwargs": {"func": null, "afunc": null, "input_type": null}}}}}, "middle": [{"lc": 1, "type": "constructor", "id": ["langchain_core", "prompts", "chat", "ChatPromptTemplate"], "kwargs": {"input_variables": ["equation_statement"], "messages": [{"lc": 1, "type": "constructor", "id": ["langchain_core", "prompts", "chat", "SystemMessagePromptTemplate"], "kwargs": {"prompt": {"lc": 1, "type": "constructor", "id": ["langchain_core", "prompts", "prompt", "PromptTemplate"], "kwargs": {"input_variables": [], "template": "Write out the following equation using algebraic symbols then solve it. Use the format\\n\\nEQUATION:...\\nSOLUTION:...\\n\\n", "template_format": "f-string", "partial_variables": {}}}}}, {"lc": 1, "type": "constructor", "id": ["langchain_core", "prompts", "chat", "HumanMessagePromptTemplate"], "kwargs": {"prompt": {"lc": 1, "type": "constructor", "id": ["langchain_core", "prompts", "prompt", "PromptTemplate"], "kwargs": {"input_variables": ["equation_statement"], "template": "{equation_statement}", "template_format": "f-string", "partial_variables": {}}}}}]}}, {"lc": 1, "type": "constructor", "id": ["langchain", "chat_models", "openai", "ChatOpenAI"], "kwargs": {"temperature": 0.0, "openai_api_key": {"lc": 1, "type": "secret", "id": ["OPENAI_API_KEY"]}}}], "last": {"lc": 1, "type": "constructor", "id": ["langchain_core", "output_parsers", "string", "StrOutputParser"], "kwargs": {}}}}`;
    const chain = await load(serializedValue, {
        OPENAI_API_KEY: "openai-key",
    });
    // @ts-expect-error testing
    expect(chain.first.constructor.lc_name()).toBe("RunnableMap");
    // @ts-expect-error testing
    expect(chain.middle.length).toBe(2);
    // @ts-expect-error testing
    expect(chain.middle[0].constructor.lc_name()).toBe(`ChatPromptTemplate`);
    // @ts-expect-error testing
    expect(chain.middle[1].constructor.lc_name()).toBe(`ChatOpenAI`);
    // @ts-expect-error testing
    expect(chain.last.constructor.lc_name()).toBe(`StrOutputParser`);
});
