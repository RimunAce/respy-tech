"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackExchangeAPI = void 0;
const tools_1 = require("@langchain/core/tools");
/**
 * Class for interacting with the StackExchange API
 * It extends the base Tool class to perform retrieval.
 */
class StackExchangeAPI extends tools_1.Tool {
    constructor(params = {}) {
        const { maxResult, queryType = "all", options, resultSeparator } = params;
        super();
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "stackexchange"
        });
        Object.defineProperty(this, "description", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "Stack Exchange API Implementation"
        });
        Object.defineProperty(this, "pageSize", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "maxResult", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 3
        });
        Object.defineProperty(this, "key", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "accessToken", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "site", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "stackoverflow"
        });
        Object.defineProperty(this, "version", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "2.3"
        });
        Object.defineProperty(this, "baseUrl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "https://api.stackexchange.com"
        });
        Object.defineProperty(this, "queryType", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "all"
        });
        Object.defineProperty(this, "options", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        });
        Object.defineProperty(this, "resultSeparator", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "\n\n"
        });
        this.maxResult = maxResult || this.maxResult;
        this.pageSize = 100;
        this.baseUrl = `${this.baseUrl}/${this.version}/`;
        this.queryType = queryType === "all" ? "q" : queryType;
        this.options = options || this.options;
        this.resultSeparator = resultSeparator || this.resultSeparator;
    }
    async _call(query) {
        const params = {
            [this.queryType]: query,
            site: this.site,
            ...this.options,
        };
        const output = await this._fetch("search/excerpts", params);
        if (output.items.length < 1) {
            return `No relevant results found for '${query}' on Stack Overflow.`;
        }
        const questions = output.items
            .filter((item) => item.item_type === "question")
            .slice(0, this.maxResult);
        const answers = output.items.filter((item) => item.item_type === "answer");
        const results = [];
        for (const question of questions) {
            let res_text = `Question: ${question.title}\n${question.excerpt}`;
            const relevant_answers = answers.filter((answer) => answer.question_id === question.question_id);
            const accepted_answers = relevant_answers.filter((answer) => answer.is_accepted);
            if (relevant_answers.length > 0) {
                const top_answer = accepted_answers.length > 0
                    ? accepted_answers[0]
                    : relevant_answers[0];
                const { excerpt } = top_answer;
                res_text += `\nAnswer: ${excerpt}`;
            }
            results.push(res_text);
        }
        return results.join(this.resultSeparator);
    }
    /**
     * Call the StackExchange API
     * @param endpoint Name of the endpoint from StackExchange API
     * @param params Additional parameters passed to the endpoint
     * @param page Number of the page to retrieve
     * @param filter Filtering properties
     */
    async _fetch(endpoint, params = {}, page = 1, filter = "default") {
        try {
            if (!endpoint) {
                throw new Error("No end point provided.");
            }
            const queryParams = new URLSearchParams({
                pagesize: this.pageSize.toString(),
                page: page.toString(),
                filter,
                ...params,
            });
            if (this.key) {
                queryParams.append("key", this.key);
            }
            if (this.accessToken) {
                queryParams.append("access_token", this.accessToken);
            }
            const queryParamsString = queryParams.toString();
            const endpointUrl = `${this.baseUrl}${endpoint}?${queryParamsString}`;
            return await this._makeRequest(endpointUrl);
        }
        catch (e) {
            throw new Error("Error while calling Stack Exchange API");
        }
    }
    /**
     * Fetch the result of a specific endpoint
     * @param endpointUrl Endpoint to call
     */
    async _makeRequest(endpointUrl) {
        try {
            const response = await fetch(endpointUrl);
            if (response.status !== 200) {
                throw new Error(`HTTP Error: ${response.statusText}`);
            }
            return await response.json();
        }
        catch (e) {
            throw new Error(`Error while calling Stack Exchange API: ${endpointUrl}`);
        }
    }
}
exports.StackExchangeAPI = StackExchangeAPI;
