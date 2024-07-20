"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAWSSfnAgent = exports.SFN_SUFFIX = exports.SFN_PREFIX = exports.AWSSfnToolkit = void 0;
const prompts_1 = require("@langchain/core/prompts");
const chains_1 = require("langchain/chains");
const agents_1 = require("langchain/agents");
const aws_sfn_js_1 = require("../../tools/aws_sfn.cjs");
const base_js_1 = require("./base.cjs");
/**
 * Class representing a toolkit for interacting with AWS Step Functions.
 * It initializes the AWS Step Functions tools and provides them as tools
 * for the agent.
 * @example
 * ```typescript
 *
 * const toolkit = new AWSSfnToolkit({
 *   name: "onboard-new-client-workflow",
 *   description:
 *     "Onboard new client workflow. Can also be used to get status of any executing workflow or state machine.",
 *   stateMachineArn:
 *     "arn:aws:states:us-east-1:1234567890:stateMachine:my-state-machine",
 *   region: "<your Sfn's region>",
 *   accessKeyId: "<your access key id>",
 *   secretAccessKey: "<your secret access key>",
 * });
 *
 *
 * const result = await toolkit.invoke({
 *   input: "Onboard john doe (john@example.com) as a new client.",
 * });
 *
 * ```
 */
class AWSSfnToolkit extends base_js_1.Toolkit {
    constructor(args) {
        super();
        Object.defineProperty(this, "tools", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "stateMachineArn", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "asl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.stateMachineArn = args.stateMachineArn;
        if (args.asl) {
            this.asl = args.asl;
        }
        this.tools = [
            new aws_sfn_js_1.StartExecutionAWSSfnTool({
                name: args.name,
                description: aws_sfn_js_1.StartExecutionAWSSfnTool.formatDescription(args.name, args.description),
                stateMachineArn: args.stateMachineArn,
            }),
            new aws_sfn_js_1.DescribeExecutionAWSSfnTool(Object.assign(args.region ? { region: args.region } : {}, args.accessKeyId && args.secretAccessKey
                ? {
                    accessKeyId: args.accessKeyId,
                    secretAccessKey: args.secretAccessKey,
                }
                : {})),
            new aws_sfn_js_1.SendTaskSuccessAWSSfnTool(Object.assign(args.region ? { region: args.region } : {}, args.accessKeyId && args.secretAccessKey
                ? {
                    accessKeyId: args.accessKeyId,
                    secretAccessKey: args.secretAccessKey,
                }
                : {})),
        ];
    }
}
exports.AWSSfnToolkit = AWSSfnToolkit;
exports.SFN_PREFIX = `You are an agent designed to interact with AWS Step Functions state machines to execute and coordinate asynchronous workflows and tasks.
Given an input question, command, or task use the appropriate tool to execute a command to interact with AWS Step Functions and return the result.
You have access to tools for interacting with AWS Step Functions.
Given an input question, command, or task use the correct tool to complete the task.
Only use the below tools. Only use the information returned by the below tools to construct your final answer.

If the question does not seem related to AWS Step Functions or an existing state machine, just return "I don't know" as the answer.`;
exports.SFN_SUFFIX = `Begin!

Question: {input}
Thought: I should look at state machines within AWS Step Functions to see what actions I can perform.
{agent_scratchpad}`;
function createAWSSfnAgent(llm, toolkit, args) {
    const { prefix = exports.SFN_PREFIX, suffix = exports.SFN_SUFFIX, inputVariables = ["input", "agent_scratchpad"], } = args ?? {};
    const { tools } = toolkit;
    const formattedPrefix = (0, prompts_1.renderTemplate)(prefix, "f-string", {});
    const prompt = agents_1.ZeroShotAgent.createPrompt(tools, {
        prefix: formattedPrefix,
        suffix,
        inputVariables,
    });
    const chain = new chains_1.LLMChain({ prompt, llm });
    const agent = new agents_1.ZeroShotAgent({
        llmChain: chain,
        allowedTools: tools.map((t) => t.name),
    });
    return agents_1.AgentExecutor.fromAgentAndTools({
        agent,
        tools,
        returnIntermediateSteps: true,
    });
}
exports.createAWSSfnAgent = createAWSSfnAgent;
