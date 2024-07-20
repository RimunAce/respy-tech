import { Tool, ToolParams } from "@langchain/core/tools";
import { SearchOptions } from "duck-duck-scrape";
export { SafeSearchType, SearchOptions, SearchTimeType, } from "duck-duck-scrape";
export interface DuckDuckGoSearchParameters extends ToolParams {
    /**
     * The search options for the search using the SearchOptions interface
     * from the duck-duck-scrape package.
     */
    searchOptions?: SearchOptions;
    /**
     * The maximum number of results to return from the search.
     * Limiting to 10 to avoid context overload.
     * @default 10
     */
    maxResults?: number;
}
/**
 * Class for interacting with the DuckDuckGo search engine
 * It extends the base Tool class to perform retrieval.
 */
export declare class DuckDuckGoSearch extends Tool {
    private searchOptions?;
    private maxResults;
    constructor(params?: DuckDuckGoSearchParameters);
    static lc_name(): string;
    name: string;
    description: string;
    _call(input: string): Promise<string>;
}
