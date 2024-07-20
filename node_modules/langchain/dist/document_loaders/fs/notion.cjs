"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotionLoader = void 0;
const directory_js_1 = require("./directory.cjs");
const text_js_1 = require("./text.cjs");
const entrypoint_deprecation_js_1 = require("../../util/entrypoint_deprecation.cjs");
/* #__PURE__ */ (0, entrypoint_deprecation_js_1.logVersion020MigrationWarning)({
    oldEntrypointName: "document_loaders/fs/notion",
    newPackageName: "@langchain/community",
});
/**
 * @deprecated - Import from "@langchain/community/document_loaders/fs/notion" instead. This entrypoint will be removed in 0.3.0.
 *
 * A class that extends the DirectoryLoader class. It represents a
 * document loader that loads documents from a directory in the Notion
 * format. It uses the TextLoader for loading '.md' files and ignores
 * unknown file types.
 */
class NotionLoader extends directory_js_1.DirectoryLoader {
    constructor(directoryPath) {
        super(directoryPath, {
            ".md": (filePath) => new text_js_1.TextLoader(filePath),
        }, true, directory_js_1.UnknownHandling.Ignore);
    }
}
exports.NotionLoader = NotionLoader;
