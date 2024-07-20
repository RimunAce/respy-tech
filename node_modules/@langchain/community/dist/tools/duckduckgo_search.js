import { Tool } from "@langchain/core/tools";
import { search } from "duck-duck-scrape";
export { SafeSearchType, SearchTimeType, } from "duck-duck-scrape";
const DEFAULT_MAX_RESULTS = 10;
/**
 * Class for interacting with the DuckDuckGo search engine
 * It extends the base Tool class to perform retrieval.
 */
export class DuckDuckGoSearch extends Tool {
    constructor(params) {
        super(params ?? {});
        Object.defineProperty(this, "searchOptions", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "maxResults", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: DEFAULT_MAX_RESULTS
        });
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "duckduckgo-search"
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "A search engine. Useful for when you need to answer questions about current events. Input should be a search query."
        });
        const { searchOptions, maxResults } = params ?? {};
        this.searchOptions = searchOptions;
        this.maxResults = maxResults || this.maxResults;
    }
    static lc_name() {
        return "DuckDuckGoSearch";
    }
    async _call(input) {
        const { results } = await search(input, this.searchOptions);
        return JSON.stringify(results
            .map((result) => ({
            title: result.title,
            link: result.url,
            snippet: result.description,
        }))
            .slice(0, this.maxResults));
    }
}
