import { createClient } from "@vercel/kv";
import { BaseCheckpointSaver, } from "@langchain/langgraph/web";
export class VercelKVSaver extends BaseCheckpointSaver {
    constructor(config, serde) {
        super(serde);
        Object.defineProperty(this, "kv", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.kv = createClient(config);
    }
    async getTuple(config) {
        const thread_id = config.configurable?.thread_id;
        const checkpoint_id = config.configurable?.checkpoint_id;
        if (!thread_id) {
            return undefined;
        }
        const key = checkpoint_id
            ? `${thread_id}:${checkpoint_id}`
            : `${thread_id}:last`;
        const row = await this.kv.get(key);
        if (!row) {
            return undefined;
        }
        const [checkpoint, metadata] = await Promise.all([
            this.serde.parse(row.checkpoint),
            this.serde.parse(row.metadata),
        ]);
        return {
            checkpoint: checkpoint,
            metadata: metadata,
            config: checkpoint_id
                ? config
                : {
                    configurable: {
                        thread_id,
                        checkpoint_id: checkpoint.id,
                    },
                },
        };
    }
    async *list(config, limit, before) {
        const thread_id = config.configurable?.thread_id;
        // LUA script to get keys excluding those starting with "last"
        const luaScript = `
      local prefix = ARGV[1]
      local cursor = '0'
      local result = {}
      repeat
        local scanResult = redis.call('SCAN', cursor, 'MATCH', prefix .. '*', 'COUNT', 1000)
        cursor = scanResult[1]
        local keys = scanResult[2]
        for _, key in ipairs(keys) do
          if key:sub(-5) ~= ':last' then
            table.insert(result, key)
          end
        end
      until cursor == '0'
      return result
    `;
        // Execute the LUA script with the thread_id as an argument
        const keys = await this.kv.eval(luaScript, [], [thread_id]);
        const filteredKeys = keys.filter((key) => {
            const [, checkpoint_id] = key.split(":");
            return !before || checkpoint_id < before?.configurable?.checkpoint_id;
        });
        const sortedKeys = filteredKeys
            .sort((a, b) => b.localeCompare(a))
            .slice(0, limit);
        const rows = await this.kv.mget(...sortedKeys);
        for (const row of rows) {
            if (row) {
                const [checkpoint, metadata] = await Promise.all([
                    this.serde.parse(row.checkpoint),
                    this.serde.parse(row.metadata),
                ]);
                yield {
                    config: {
                        configurable: {
                            thread_id,
                            checkpoint_id: checkpoint.id,
                        },
                    },
                    checkpoint: checkpoint,
                    metadata: metadata,
                };
            }
        }
    }
    async put(config, checkpoint, metadata) {
        const thread_id = config.configurable?.thread_id;
        if (!thread_id || !checkpoint.id) {
            throw new Error("Thread ID and Checkpoint ID must be defined");
        }
        const row = {
            checkpoint: this.serde.stringify(checkpoint),
            metadata: this.serde.stringify(metadata),
        };
        // LUA script to set checkpoint data atomically"
        const luaScript = `
      local thread_id = ARGV[1]
      local checkpoint_id = ARGV[2]
      local row = ARGV[3]

      redis.call('SET', thread_id .. ':' .. checkpoint_id, row)
      redis.call('SET', thread_id .. ':last', row)
    `;
        // Save the checkpoint and the last checkpoint
        await this.kv.eval(luaScript, [], [thread_id, checkpoint.id, row]);
        return {
            configurable: {
                thread_id,
                checkpoint_id: checkpoint.id,
            },
        };
    }
}
