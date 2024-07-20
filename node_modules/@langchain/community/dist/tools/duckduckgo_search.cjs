"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DuckDuckGoSearch = exports.SearchTimeType = exports.SafeSearchType = void 0;
const tools_1 = require("@langchain/core/tools");
const duck_duck_scrape_1 = require("duck-duck-scrape");
var duck_duck_scrape_2 = require("duck-duck-scrape");
Object.defineProperty(exports, "SafeSearchType", { enumerable: true, get: function () { return duck_duck_scrape_2.SafeSearchType; } });
Object.defineProperty(exports, "SearchTimeType", { enumerable: true, get: function () { return duck_duck_scrape_2.SearchTimeType; } });
const DEFAULT_MAX_RESULTS = 10;
/**
 * Class for interacting with the DuckDuckGo search engine
 * It extends the base Tool class to perform retrieval.
 */
class DuckDuckGoSearch extends tools_1.Tool {
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
        const { results } = await (0, duck_duck_scrape_1.search)(input, this.searchOptions);
        return JSON.stringify(results
            .map((result) => ({
            title: result.title,
            link: result.url,
            snippet: result.description,
        }))
            .slice(0, this.maxResults));
    }
}
exports.DuckDuckGoSearch = DuckDuckGoSearch;
