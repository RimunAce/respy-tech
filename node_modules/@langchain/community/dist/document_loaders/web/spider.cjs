"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpiderLoader = void 0;
const spider_client_1 = require("@spider-cloud/spider-client");
const documents_1 = require("@langchain/core/documents");
const env_1 = require("@langchain/core/utils/env");
const base_1 = require("@langchain/core/document_loaders/base");
/**
 * Class representing a document loader for loading data from
 * Spider (spider.cloud). It extends the BaseDocumentLoader class.
 * @example
 * ```typescript
 * const loader = new SpiderLoader({
 *   url: "{url}",
 *   apiKey: "{apiKey}",
 *   mode: "crawl"
 * });
 * const docs = await loader.load();
 * ```
 */
class SpiderLoader extends base_1.BaseDocumentLoader {
    constructor(loaderParams) {
        super();
        Object.defineProperty(this, "apiKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "url", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "mode", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "params", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        const { apiKey = (0, env_1.getEnvironmentVariable)("SPIDER_API_KEY"), url, mode = "scrape", params, } = loaderParams;
        if (!apiKey) {
            throw new Error("Spider API key not set. You can set it as SPIDER_API_KEY in your .env file, or pass it to Spider.");
        }
        this.apiKey = apiKey;
        this.url = url;
        this.mode = mode;
        this.params = params || { metadata: true, return_format: "markdown" };
    }
    /**
     * Loads the data from the Spider.
     * @returns An array of Documents representing the retrieved data.
     * @throws An error if the data could not be loaded.
     */
    async load() {
        const app = new spider_client_1.Spider({ apiKey: this.apiKey });
        let spiderDocs;
        if (this.mode === "scrape") {
            const response = await app.scrapeUrl(this.url, this.params);
            if (response.error) {
                throw new Error(`Spider: Failed to scrape URL. Error: ${response.error}`);
            }
            spiderDocs = response;
        }
        else if (this.mode === "crawl") {
            const response = await app.crawlUrl(this.url, this.params);
            if (response.error) {
                throw new Error(`Spider: Failed to crawl URL. Error: ${response.error}`);
            }
            spiderDocs = response;
        }
        else {
            throw new Error(`Unrecognized mode '${this.mode}'. Expected one of 'crawl', 'scrape'.`);
        }
        return spiderDocs.map((doc) => new documents_1.Document({
            pageContent: doc.content || "",
            metadata: doc.metadata || {},
        }));
    }
}
exports.SpiderLoader = SpiderLoader;
