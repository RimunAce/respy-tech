"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QdrantTranslator = void 0;
const structured_query_1 = require("@langchain/core/structured_query");
/**
 * A class that translates or converts `StructuredQuery` to equivalent Qdrant filters.
 * @example
 * ```typescript
 * const selfQueryRetriever = new SelfQueryRetriever({
 *   llm: new ChatOpenAI(),
 *   vectorStore: new QdrantVectorStore(...),
 *   documentContents: "Brief summary of a movie",
 *   attributeInfo: [],
 *   structuredQueryTranslator: new QdrantTranslator(),
 * });
 *
 * const relevantDocuments = await selfQueryRetriever.getRelevantDocuments(
 *   "Which movies are rated higher than 8.5?",
 * );
 * ```
 */
class QdrantTranslator extends structured_query_1.BaseTranslator {
    constructor() {
        super(...arguments);
        Object.defineProperty(this, "allowedOperators", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: [structured_query_1.Operators.and, structured_query_1.Operators.or, structured_query_1.Operators.not]
        });
        Object.defineProperty(this, "allowedComparators", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: [
                structured_query_1.Comparators.eq,
                structured_query_1.Comparators.ne,
                structured_query_1.Comparators.lt,
                structured_query_1.Comparators.lte,
                structured_query_1.Comparators.gt,
                structured_query_1.Comparators.gte,
            ]
        });
    }
    /**
     * Visits an operation and returns a QdrantFilter.
     * @param operation The operation to visit.
     * @returns A QdrantFilter.
     */
    visitOperation(operation) {
        const args = operation.args?.map((arg) => arg.accept(this));
        const operator = {
            [structured_query_1.Operators.and]: "must",
            [structured_query_1.Operators.or]: "should",
            [structured_query_1.Operators.not]: "must_not",
        }[operation.operator];
        return {
            [operator]: args,
        };
    }
    /**
     * Visits a comparison and returns a QdrantCondition.
     * The value is casted to the correct type.
     * The attribute is prefixed with "metadata.",
     * since metadata is nested in the Qdrant payload.
     * @param comparison The comparison to visit.
     * @returns A QdrantCondition.
     */
    visitComparison(comparison) {
        const attribute = `metadata.${comparison.attribute}`;
        const value = (0, structured_query_1.castValue)(comparison.value);
        if (comparison.comparator === "eq") {
            return {
                key: attribute,
                match: {
                    value,
                },
            };
        }
        else if (comparison.comparator === "ne") {
            return {
                key: attribute,
                match: {
                    except: [value],
                },
            };
        }
        if (!(0, structured_query_1.isInt)(value) && !(0, structured_query_1.isFloat)(value)) {
            throw new Error("Value for gt, gte, lt, lte must be a number");
        }
        // For gt, gte, lt, lte, we need to use the range filter
        return {
            key: attribute,
            range: {
                [comparison.comparator]: value,
            },
        };
    }
    /**
     * Visits a structured query and returns a VisitStructuredQueryOutput.
     * If the query has a filter, it is visited.
     * @param query The structured query to visit.
     * @returns An instance of VisitStructuredQueryOutput.
     */
    visitStructuredQuery(query) {
        let nextArg = {};
        if (query.filter) {
            nextArg = {
                filter: { must: [query.filter.accept(this)] },
            };
        }
        return nextArg;
    }
    /**
     * Merges two filters into one. If both filters are empty, returns
     * undefined. If one filter is empty or the merge type is 'replace',
     * returns the other filter. If the merge type is 'and' or 'or', returns a
     * new filter with the merged results. Throws an error for unknown merge
     * types.
     * @param defaultFilter The default filter to merge.
     * @param generatedFilter The generated filter to merge.
     * @param mergeType The type of merge to perform. Can be 'and', 'or', or 'replace'. Defaults to 'and'.
     * @param forceDefaultFilter If true, the default filter is always returned if the generated filter is empty. Defaults to false.
     * @returns A merged QdrantFilter, or undefined if both filters are empty.
     */
    mergeFilters(defaultFilter, generatedFilter, mergeType = "and", forceDefaultFilter = false) {
        if ((0, structured_query_1.isFilterEmpty)(defaultFilter) && (0, structured_query_1.isFilterEmpty)(generatedFilter)) {
            return undefined;
        }
        if ((0, structured_query_1.isFilterEmpty)(defaultFilter) || mergeType === "replace") {
            if ((0, structured_query_1.isFilterEmpty)(generatedFilter)) {
                return undefined;
            }
            return generatedFilter;
        }
        if ((0, structured_query_1.isFilterEmpty)(generatedFilter)) {
            if (forceDefaultFilter) {
                return defaultFilter;
            }
            if (mergeType === "and") {
                return undefined;
            }
            return defaultFilter;
        }
        if (mergeType === "and") {
            return {
                must: [defaultFilter, generatedFilter],
            };
        }
        else if (mergeType === "or") {
            return {
                should: [defaultFilter, generatedFilter],
            };
        }
        else {
            throw new Error("Unknown merge type");
        }
    }
    formatFunction() {
        throw new Error("Not implemented");
    }
}
exports.QdrantTranslator = QdrantTranslator;
