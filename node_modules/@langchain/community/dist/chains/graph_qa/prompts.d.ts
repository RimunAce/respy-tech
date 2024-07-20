import { PromptTemplate } from "@langchain/core/prompts";
export declare const CYPHER_GENERATION_PROMPT: PromptTemplate<{
    schema: any;
    question: any;
}, any>;
export declare const CYPHER_QA_PROMPT: PromptTemplate<{
    question: any;
    context: any;
}, any>;
