"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserbaseLoader = void 0;
const documents_1 = require("@langchain/core/documents");
const base_1 = require("@langchain/core/document_loaders/base");
const sdk_1 = __importDefault(require("@browserbasehq/sdk"));
/**
 * Load pre-rendered web pages using a headless browser hosted on Browserbase.
 *
 * Depends on `@browserbasehq/sdk` package.
 * Get your API key from https://browserbase.com
 *
 * @example
 * ```typescript
 * import { BrowserbaseLoader } from "langchain/document_loaders/web/browserbase";
 *
 * const loader = new BrowserbaseLoader(["https://example.com"], {
 *   apiKey: process.env.BROWSERBASE_API_KEY,
 *   textContent: true,
 * });
 *
 * const docs = await loader.load();
 * ```
 *
 * @param {string[]} urls - The URLs of the web pages to load.
 * @param {BrowserbaseLoaderOptions} [options] - Browserbase client options.
 */
class BrowserbaseLoader extends base_1.BaseDocumentLoader {
    constructor(urls, options = {}) {
        super();
        Object.defineProperty(this, "urls", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "options", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "browserbase", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.urls = urls;
        this.options = options;
        this.browserbase = new sdk_1.default(options);
    }
    /**
     * Load pages from URLs.
     *
     * @returns {Promise<DocumentInterface[]>} - A promise which resolves to a list of documents.
     */
    async load() {
        const documents = [];
        for await (const doc of this.lazyLoad()) {
            documents.push(doc);
        }
        return documents;
    }
    /**
     * Load pages from URLs.
     *
     * @returns {Generator<DocumentInterface>} - A generator that yields documents.
     */
    async *lazyLoad() {
        const pages = await this.browserbase.loadURLs(this.urls, this.options);
        let index = 0;
        for await (const page of pages) {
            yield new documents_1.Document({
                pageContent: page,
                metadata: {
                    url: this.urls[index],
                },
            });
            index += index + 1;
        }
    }
}
exports.BrowserbaseLoader = BrowserbaseLoader;
