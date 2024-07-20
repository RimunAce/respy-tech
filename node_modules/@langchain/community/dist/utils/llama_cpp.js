import { LlamaModel, LlamaContext, LlamaChatSession, LlamaJsonSchemaGrammar, LlamaGrammar, } from "node-llama-cpp";
export function createLlamaModel(inputs) {
    const options = {
        gpuLayers: inputs?.gpuLayers,
        modelPath: inputs.modelPath,
        useMlock: inputs?.useMlock,
        useMmap: inputs?.useMmap,
        vocabOnly: inputs?.vocabOnly,
        jsonSchema: inputs?.jsonSchema,
        gbnf: inputs?.gbnf,
    };
    return new LlamaModel(options);
}
export function createLlamaContext(model, inputs) {
    const options = {
        batchSize: inputs?.batchSize,
        contextSize: inputs?.contextSize,
        embedding: inputs?.embedding,
        f16Kv: inputs?.f16Kv,
        logitsAll: inputs?.logitsAll,
        model,
        prependBos: inputs?.prependBos,
        seed: inputs?.seed,
        threads: inputs?.threads,
    };
    return new LlamaContext(options);
}
export function createLlamaSession(context) {
    return new LlamaChatSession({ context });
}
export function createLlamaJsonSchemaGrammar(schemaString) {
    if (schemaString === undefined) {
        return undefined;
    }
    const schemaJSON = schemaString;
    return new LlamaJsonSchemaGrammar(schemaJSON);
}
export function createCustomGrammar(filePath) {
    return filePath === undefined
        ? undefined
        : new LlamaGrammar({ grammar: filePath });
}
