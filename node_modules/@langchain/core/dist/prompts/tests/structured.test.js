import { RunnableLambda } from "../../runnables/base.js";
import { FakeListChatModel } from "../../utils/testing/index.js";
import { StructuredPrompt } from "../structured.js";
import { load } from "../../load/index.js";
class FakeStructuredChatModel extends FakeListChatModel {
    withStructuredOutput(_params, _config) {
        if (!_config?.includeRaw) {
            if (typeof _params === "object") {
                const func = RunnableLambda.from((_) => _params);
                return func;
            }
        }
        throw new Error("Invalid schema");
    }
}
test("Test format", async () => {
    const schema = {
        name: "yo",
        description: "a structured output",
        parameters: {
            name: { type: "string" },
            value: { type: "integer" },
        },
    };
    const prompt = StructuredPrompt.fromMessagesAndSchema([["human", "I'm very structured, how about you?"]], schema);
    const model = new FakeStructuredChatModel({ responses: [] });
    const chain = prompt.pipe(model);
    await chain.invoke({});
    await expect(chain.invoke({})).resolves.toEqual(schema);
    const revived = await load(JSON.stringify(prompt));
    expect(JSON.stringify(prompt)).toEqual('{"lc":1,"type":"constructor","id":["langchain_core","prompts","structured","StructuredPrompt"],"kwargs":{"schema_":{"name":"yo","description":"a structured output","parameters":{"name":{"type":"string"},"value":{"type":"integer"}}},"input_variables":[],"messages":[{"lc":1,"type":"constructor","id":["langchain_core","prompts","chat","HumanMessagePromptTemplate"],"kwargs":{"prompt":{"lc":1,"type":"constructor","id":["langchain_core","prompts","prompt","PromptTemplate"],"kwargs":{"input_variables":[],"template_format":"f-string","template":"I\'m very structured, how about you?","schema":{"name":"yo","description":"a structured output","parameters":{"name":{"type":"string"},"value":{"type":"integer"}}}}}}}]}}');
    const revivedChain = revived.pipe(model);
    await expect(revivedChain.invoke({})).resolves.toEqual(schema);
    const boundModel = model.bind({ runName: "boundModel" });
    const chainWithBoundModel = prompt.pipe(boundModel);
    await expect(chainWithBoundModel.invoke({})).resolves.toEqual(schema);
});
