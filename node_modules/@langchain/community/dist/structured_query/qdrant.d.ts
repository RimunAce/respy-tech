import { BaseTranslator, Comparator, Comparison, Operation, Operator, StructuredQuery } from "@langchain/core/structured_query";
import { QdrantVectorStore, QdrantFilter, QdrantCondition } from "../vectorstores/qdrant.js";
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
export declare class QdrantTranslator<T extends QdrantVectorStore> extends BaseTranslator<T> {
    VisitOperationOutput: QdrantFilter;
    VisitComparisonOutput: QdrantCondition;
    allowedOperators: Operator[];
    allowedComparators: Comparator[];
    /**
     * Visits an operation and returns a QdrantFilter.
     * @param operation The operation to visit.
     * @returns A QdrantFilter.
     */
    visitOperation(operation: Operation): this["VisitOperationOutput"];
    /**
     * Visits a comparison and returns a QdrantCondition.
     * The value is casted to the correct type.
     * The attribute is prefixed with "metadata.",
     * since metadata is nested in the Qdrant payload.
     * @param comparison The comparison to visit.
     * @returns A QdrantCondition.
     */
    visitComparison(comparison: Comparison): this["VisitComparisonOutput"];
    /**
     * Visits a structured query and returns a VisitStructuredQueryOutput.
     * If the query has a filter, it is visited.
     * @param query The structured query to visit.
     * @returns An instance of VisitStructuredQueryOutput.
     */
    visitStructuredQuery(query: StructuredQuery): this["VisitStructuredQueryOutput"];
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
    mergeFilters(defaultFilter: QdrantFilter | undefined, generatedFilter: QdrantFilter | undefined, mergeType?: string, forceDefaultFilter?: boolean): QdrantFilter | undefined;
    formatFunction(): string;
}
