import { type DocumentInterface } from "@langchain/core/documents";
import { BaseDocumentLoader } from "../base.js";
/**
 * Interface representing the parameters for the Firecrawl loader. It
 * includes properties such as the URL to scrape or crawl and the API key.
 */
interface FirecrawlLoaderParameters {
    /**
     * URL to scrape or crawl
     */
    url: string;
    /**
     * API key for Firecrawl. If not provided, the default value is the value of the FIRECRAWL_API_KEY environment variable.
     */
    apiKey?: string;
    /**
     * Mode of operation. Can be either "crawl" or "scrape". If not provided, the default value is "crawl".
     */
    mode?: "crawl" | "scrape";
    params?: Record<string, unknown>;
}
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
export declare class FireCrawlLoader extends BaseDocumentLoader {
    private apiKey;
    private url;
    private mode;
    private params?;
    constructor(loaderParams: FirecrawlLoaderParameters);
    /**
     * Loads the data from the Firecrawl.
     * @returns An array of Documents representing the retrieved data.
     * @throws An error if the data could not be loaded.
     */
    load(): Promise<DocumentInterface[]>;
}
export {};
