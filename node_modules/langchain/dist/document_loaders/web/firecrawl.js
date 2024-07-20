import FirecrawlApp from "@mendable/firecrawl-js";
import { Document } from "@langchain/core/documents";
import { getEnvironmentVariable } from "@langchain/core/utils/env";
import { BaseDocumentLoader } from "../base.js";
import { logVersion020MigrationWarning } from "../../util/entrypoint_deprecation.js";
/* #__PURE__ */ logVersion020MigrationWarning({
    oldEntrypointName: "document_loaders/web/firecrawl",
    newPackageName: "@langchain/community",
});
/**
 * @deprecated - Import from "@langchain/community/document_loaders/web/firecrawl" instead. This entrypoint will be removed in 0.3.0.
 *
 * Class representing a document loader for loading data from
 * Firecrawl (firecrawl.dev). It extends the BaseDocumentLoader class.
 * @example
 * ```typescript
 * const loader = new FireCrawlLoader({
 *   url: "{url}",
 *   apiKey: "{apiKey}",
 *   mode: "crawl"
 * });
 * const docs = await loader.load();
 * ```
 */
export class FireCrawlLoader extends BaseDocumentLoader {
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
        const { apiKey = getEnvironmentVariable("FIRECRAWL_API_KEY"), url, mode = "crawl", params, } = loaderParams;
        if (!apiKey) {
            throw new Error("Firecrawl API key not set. You can set it as FIRECRAWL_API_KEY in your .env file, or pass it to Firecrawl.");
        }
        this.apiKey = apiKey;
        this.url = url;
        this.mode = mode;
        this.params = params;
    }
    /**
     * Loads the data from the Firecrawl.
     * @returns An array of Documents representing the retrieved data.
     * @throws An error if the data could not be loaded.
     */
    async load() {
        const app = new FirecrawlApp({ apiKey: this.apiKey });
        let firecrawlDocs;
        if (this.mode === "scrape") {
            const response = await app.scrapeUrl(this.url, this.params);
            if (!response.success) {
                throw new Error(`Firecrawl: Failed to scrape URL. Error: ${response.error}`);
            }
            firecrawlDocs = [response.data];
        }
        else if (this.mode === "crawl") {
            const response = await app.crawlUrl(this.url, this.params, true);
            firecrawlDocs = response;
        }
        else {
            throw new Error(`Unrecognized mode '${this.mode}'. Expected one of 'crawl', 'scrape'.`);
        }
        return firecrawlDocs.map((doc) => new Document({
            pageContent: doc.markdown || "",
            metadata: doc.metadata || {},
        }));
    }
}
