"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FigmaFileLoader = void 0;
const documents_1 = require("@langchain/core/documents");
const env_1 = require("@langchain/core/utils/env");
const base_js_1 = require("../base.cjs");
const entrypoint_deprecation_js_1 = require("../../util/entrypoint_deprecation.cjs");
/* #__PURE__ */ (0, entrypoint_deprecation_js_1.logVersion020MigrationWarning)({
    oldEntrypointName: "document_loaders/web/figma",
    newPackageName: "@langchain/community",
});
/**
 * @deprecated - Import from "@langchain/community/document_loaders/web/figma" instead. This entrypoint will be removed in 0.3.0.
 *
 * Class representing a document loader for loading Figma files. It
 * extends the BaseDocumentLoader and implements the FigmaLoaderParams
 * interface. The constructor takes a config object as a parameter, which
 * contains the access token, an array of node IDs, and the file key.
 * @example
 * ```typescript
 * const loader = new FigmaFileLoader({
 *   accessToken: "FIGMA_ACCESS_TOKEN",
 *   nodeIds: ["id1", "id2", "id3"],
 *   fileKey: "key",
 * });
 * const docs = await loader.load();
 * ```
 */
class FigmaFileLoader extends base_js_1.BaseDocumentLoader {
    constructor({ accessToken = (0, env_1.getEnvironmentVariable)("FIGMA_ACCESS_TOKEN"), nodeIds, fileKey, }) {
        super();
        Object.defineProperty(this, "accessToken", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "nodeIds", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "fileKey", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "headers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        });
        this.accessToken = accessToken;
        this.nodeIds = nodeIds;
        this.fileKey = fileKey;
        if (this.accessToken) {
            this.headers = {
                "x-figma-token": this.accessToken,
            };
        }
    }
    /**
     * Constructs the URL for the Figma API call.
     * @returns The constructed URL as a string.
     */
    constructFigmaApiURL() {
        return `https://api.figma.com/v1/files/${this.fileKey}/nodes?ids=${this.nodeIds.join(",")}`;
    }
    /**
     * Fetches the Figma file using the Figma API and returns it as a
     * FigmaFile object.
     * @returns A Promise that resolves to a FigmaFile object.
     */
    async getFigmaFile() {
        const url = this.constructFigmaApiURL();
        const response = await fetch(url, { headers: this.headers });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(`Unable to get figma file: ${response.status} ${JSON.stringify(data)}`);
        }
        if (!data) {
            throw new Error("Unable to get file");
        }
        return data;
    }
    /**
     * Fetches the Figma file using the Figma API, creates a Document instance
     * with the JSON representation of the file as the page content and the
     * API URL as the metadata, and returns it.
     * @returns A Promise that resolves to an array of Document instances.
     */
    async load() {
        const data = await this.getFigmaFile();
        const text = JSON.stringify(data);
        const metadata = { source: this.constructFigmaApiURL() };
        return [new documents_1.Document({ pageContent: text, metadata })];
    }
}
exports.FigmaFileLoader = FigmaFileLoader;
