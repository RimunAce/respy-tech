"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChromaTranslator = void 0;
const structured_query_1 = require("@langchain/core/structured_query");
const entrypoint_deprecation_js_1 = require("../../util/entrypoint_deprecation.cjs");
/* #__PURE__ */ (0, entrypoint_deprecation_js_1.logVersion020MigrationWarning)({
    oldEntrypointName: "retrievers/self_query/chroma",
    newEntrypointName: "structured_query/chroma",
    newPackageName: "@langchain/community",
});
/**
 * Specialized translator for the Chroma vector database. It extends the
 * BasicTranslator class and translates internal query language elements
 * to valid filters. The class defines a subset of allowed logical
 * operators and comparators that can be used in the translation process.
 * @example
 * ```typescript
 * const chromaTranslator = new ChromaTranslator();
 * const selfQueryRetriever = new SelfQueryRetriever({
 *   llm: new ChatOpenAI(),
 *   vectorStore: new Chroma(),
 *   documentContents: "Brief summary of a movie",
 *   attributeInfo: [],
 *   structuredQueryTranslator: chromaTranslator,
 * });
 *
 * const relevantDocuments = await selfQueryRetriever.getRelevantDocuments(
 *   "Which movies are directed by Greta Gerwig?",
 * );
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
class ChromaTranslator extends structured_query_1.BasicTranslator {
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
exports.ChromaTranslator = ChromaTranslator;
