import { DirectoryLoader } from "./directory.js";
/**
 * @deprecated - Import from "@langchain/community/document_loaders/fs/notion" instead. This entrypoint will be removed in 0.3.0.
 *
 * A class that extends the DirectoryLoader class. It represents a
 * document loader that loads documents from a directory in the Notion
 * format. It uses the TextLoader for loading '.md' files and ignores
 * unknown file types.
 */
export declare class NotionLoader extends DirectoryLoader {
    constructor(directoryPath: string);
}
