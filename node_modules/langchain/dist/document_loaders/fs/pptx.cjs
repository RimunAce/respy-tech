"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PPTXLoader = void 0;
const officeparser_1 = require("officeparser");
const documents_1 = require("@langchain/core/documents");
const buffer_js_1 = require("./buffer.cjs");
const entrypoint_deprecation_js_1 = require("../../util/entrypoint_deprecation.cjs");
/* #__PURE__ */ (0, entrypoint_deprecation_js_1.logVersion020MigrationWarning)({
    oldEntrypointName: "document_loaders/fs/pptx",
    newPackageName: "@langchain/community",
});
/**
 * @deprecated - Import from "@langchain/community/document_loaders/fs/pptx" instead. This entrypoint will be removed in 0.3.0.
 *
 * A class that extends the `BufferLoader` class. It represents a document
 * loader that loads documents from PDF files.
 */
class PPTXLoader extends buffer_js_1.BufferLoader {
    constructor(filePathOrBlob) {
        super(filePathOrBlob);
    }
    /**
     * A method that takes a `raw` buffer and `metadata` as parameters and
     * returns a promise that resolves to an array of `Document` instances. It
     * uses the `parseOfficeAsync` function from the `officeparser` module to extract
     * the raw text content from the buffer. If the extracted powerpoint content is
     * empty, it returns an empty array. Otherwise, it creates a new
     * `Document` instance with the extracted powerpoint content and the provided
     * metadata, and returns it as an array.
     * @param raw The buffer to be parsed.
     * @param metadata The metadata of the document.
     * @returns A promise that resolves to an array of `Document` instances.
     */
    async parse(raw, metadata) {
        const pptx = await (0, officeparser_1.parseOfficeAsync)(raw, { outputErrorToConsole: true });
        if (!pptx)
            return [];
        return [
            new documents_1.Document({
                pageContent: pptx,
                metadata,
            }),
        ];
    }
}
exports.PPTXLoader = PPTXLoader;
