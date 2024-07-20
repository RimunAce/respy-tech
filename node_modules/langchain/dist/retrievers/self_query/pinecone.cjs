"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PineconeTranslator = void 0;
const structured_query_1 = require("@langchain/core/structured_query");
const entrypoint_deprecation_js_1 = require("../../util/entrypoint_deprecation.cjs");
/* #__PURE__ */ (0, entrypoint_deprecation_js_1.logVersion020MigrationWarning)({
    oldEntrypointName: "retrievers/self_query/pinecone",
    newEntrypointName: "",
    newPackageName: "@langchain/pinecone",
});
/**
 * Specialized translator class that extends the BasicTranslator. It is
 * designed to work with PineconeStore, a type of vector store in
 * LangChain. The class is initialized with a set of allowed operators and
 * comparators, which are used in the translation process to construct
 * queries and compare results.
 * @example
 * ```typescript
 * const selfQueryRetriever = SelfQueryRetriever.fromLLM({
 *   llm: new ChatOpenAI(),
 *   vectorStore: new PineconeStore(),
 *   documentContents: "Brief summary of a movie",
 *   attributeInfo: [],
 *   structuredQueryTranslator: new PineconeTranslator(),
 * });
 *
 * const queryResult = await selfQueryRetriever.getRelevantDocuments(
 *   "Which movies are directed by Greta Gerwig?",
 * );
 * ```
 */
class PineconeTranslator extends structured_query_1.BasicTranslator {
    constructor() {
        super({
            allowedOperators: [structured_query_1.Operators.and, structured_query_1.Operators.or],
            allowedComparators: [
                structured_query_1.Comparators.eq,
                structured_query_1.Comparators.ne,
                structured_query_1.Comparators.gt,
                structured_query_1.Comparators.gte,
                structured_query_1.Comparators.lt,
                structured_query_1.Comparators.lte,
            ],
        });
    }
}
exports.PineconeTranslator = PineconeTranslator;
