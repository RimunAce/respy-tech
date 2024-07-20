import { LLM, } from "@langchain/core/language_models/llms";
import { LayerupSecurity as LayerupSecuritySDK, } from "@layerup/layerup-security";
function defaultGuardrailViolationHandler(violation) {
    if (violation.canned_response)
        return violation.canned_response;
    const guardrailName = violation.offending_guardrail
        ? `Guardrail ${violation.offending_guardrail}`
        : "A guardrail";
    throw new Error(`${guardrailName} was violated without a proper guardrail violation handler.`);
}
export class LayerupSecurity extends LLM {
    static lc_name() {
        return "LayerupSecurity";
    }
    constructor(options) {
        super(options);
        Object.defineProperty(this, "lc_serializable", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
        Object.defineProperty(this, "llm", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "layerupApiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "layerupApiBaseUrl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "https://api.uselayerup.com/v1"
        });
        Object.defineProperty(this, "promptGuardrails", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "responseGuardrails", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "mask", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "metadata", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        });
        Object.defineProperty(this, "handlePromptGuardrailViolation", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: defaultGuardrailViolationHandler
        });
        Object.defineProperty(this, "handleResponseGuardrailViolation", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: defaultGuardrailViolationHandler
        });
        Object.defineProperty(this, "layerup", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        if (!options.llm) {
            throw new Error("Layerup Security requires an LLM to be provided.");
        }
        else if (!options.layerupApiKey) {
            throw new Error("Layerup Security requires an API key to be provided.");
        }
        this.llm = options.llm;
        this.layerupApiKey = options.layerupApiKey;
        this.layerupApiBaseUrl =
            options.layerupApiBaseUrl || this.layerupApiBaseUrl;
        this.promptGuardrails = options.promptGuardrails || this.promptGuardrails;
        this.responseGuardrails =
            options.responseGuardrails || this.responseGuardrails;
        this.mask = options.mask || this.mask;
        this.metadata = options.metadata || this.metadata;
        this.handlePromptGuardrailViolation =
            options.handlePromptGuardrailViolation ||
                this.handlePromptGuardrailViolation;
        this.handleResponseGuardrailViolation =
            options.handleResponseGuardrailViolation ||
                this.handleResponseGuardrailViolation;
        this.layerup = new LayerupSecuritySDK({
            apiKey: this.layerupApiKey,
            baseURL: this.layerupApiBaseUrl,
        });
    }
    _llmType() {
        return "layerup_security";
    }
    async _call(input, options) {
        // Since LangChain LLMs only support string inputs, we will wrap each call to Layerup in a single-message
        // array of messages, then extract the string element when we need to access it.
        let messages = [
            {
                role: "user",
                content: input,
            },
        ];
        let unmaskResponse;
        if (this.mask) {
            [messages, unmaskResponse] = await this.layerup.maskPrompt(messages, this.metadata);
        }
        if (this.promptGuardrails.length > 0) {
            const securityResponse = await this.layerup.executeGuardrails(this.promptGuardrails, messages, input, this.metadata);
            // If there is a guardrail violation, extract the canned response and reply with that instead
            if (!securityResponse.all_safe) {
                const replacedResponse = this.handlePromptGuardrailViolation(securityResponse);
                return replacedResponse.content;
            }
        }
        // Invoke the underlying LLM with the prompt and options
        let result = await this.llm.invoke(messages[0].content, options);
        if (this.mask && unmaskResponse) {
            result = unmaskResponse(result);
        }
        // Add to messages array for response guardrail handler
        messages.push({
            role: "assistant",
            content: result,
        });
        if (this.responseGuardrails.length > 0) {
            const securityResponse = await this.layerup.executeGuardrails(this.responseGuardrails, messages, result, this.metadata);
            // If there is a guardrail violation, extract the canned response and reply with that instead
            if (!securityResponse.all_safe) {
                const replacedResponse = this.handleResponseGuardrailViolation(securityResponse);
                return replacedResponse.content;
            }
        }
        return result;
    }
}
