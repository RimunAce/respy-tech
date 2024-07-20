import { v4 as uuidv4, validate } from "uuid";
import { ChatPromptTemplate, HumanMessagePromptTemplate, SystemMessagePromptTemplate, } from "../../prompts/chat.js";
import { BaseLLM } from "../../language_models/llms.js";
import { StringOutputParser } from "../../output_parsers/string.js";
import { RunCollectorCallbackHandler } from "../../tracers/run_collector.js";
class FakeLLM extends BaseLLM {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "nrMapCalls", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "nrReduceCalls", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
    }
    _llmType() {
        return "fake_1";
    }
    async _generate(_prompts) {
        return {
            generations: [
                [
                    {
                        text: "Foo.",
                    },
                ],
            ],
        };
    }
}
describe("RunCollectorCallbackHandler", () => {
    it("should persist the given run object and set the reference_example_id to the exampleId", async () => {
        // Create a chain that uses the dataset
        const prompt = ChatPromptTemplate.fromMessages([
            SystemMessagePromptTemplate.fromTemplate("You are in a rap battle."),
            HumanMessagePromptTemplate.fromTemplate("Write the following {input}"),
        ]);
        const model = new FakeLLM({});
        const chain = prompt.pipe(model).pipe(new StringOutputParser());
        const exampleId = uuidv4();
        const collector = new RunCollectorCallbackHandler({ exampleId });
        await chain.invoke({ input: "foo" }, { callbacks: [collector] });
        expect(collector.tracedRuns.length).toBe(1);
        const tracedRun = collector.tracedRuns[0];
        expect(tracedRun.id).toBeDefined();
        if (tracedRun.id && validate(tracedRun.id)) {
            expect(validate(tracedRun.id)).toBe(true);
        }
        expect(tracedRun.reference_example_id).toBe(exampleId);
        expect(tracedRun?.child_runs?.length).toBe(3);
    });
});
