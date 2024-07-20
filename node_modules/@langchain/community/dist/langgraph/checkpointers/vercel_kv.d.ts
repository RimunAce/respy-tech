import { RunnableConfig } from "@langchain/core/runnables";
import { BaseCheckpointSaver, Checkpoint, CheckpointMetadata, CheckpointTuple, SerializerProtocol } from "@langchain/langgraph/web";
interface KVConfig {
    url: string;
    token: string;
}
export declare class VercelKVSaver extends BaseCheckpointSaver {
    private kv;
    constructor(config: KVConfig, serde?: SerializerProtocol<unknown>);
    getTuple(config: RunnableConfig): Promise<CheckpointTuple | undefined>;
    list(config: RunnableConfig, limit?: number, before?: RunnableConfig): AsyncGenerator<CheckpointTuple>;
    put(config: RunnableConfig, checkpoint: Checkpoint, metadata: CheckpointMetadata): Promise<RunnableConfig>;
}
export {};
