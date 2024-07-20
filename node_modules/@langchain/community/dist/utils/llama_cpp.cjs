"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCustomGrammar = exports.createLlamaJsonSchemaGrammar = exports.createLlamaSession = exports.createLlamaContext = exports.createLlamaModel = void 0;
const node_llama_cpp_1 = require("node-llama-cpp");
function createLlamaModel(inputs) {
    const options = {
        gpuLayers: inputs?.gpuLayers,
        modelPath: inputs.modelPath,
        useMlock: inputs?.useMlock,
        useMmap: inputs?.useMmap,
        vocabOnly: inputs?.vocabOnly,
        jsonSchema: inputs?.jsonSchema,
        gbnf: inputs?.gbnf,
    };
    return new node_llama_cpp_1.LlamaModel(options);
}
exports.createLlamaModel = createLlamaModel;
function createLlamaContext(model, inputs) {
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
    return new node_llama_cpp_1.LlamaContext(options);
}
exports.createLlamaContext = createLlamaContext;
function createLlamaSession(context) {
    return new node_llama_cpp_1.LlamaChatSession({ context });
}
exports.createLlamaSession = createLlamaSession;
function createLlamaJsonSchemaGrammar(schemaString) {
    if (schemaString === undefined) {
        return undefined;
    }
    const schemaJSON = schemaString;
    return new node_llama_cpp_1.LlamaJsonSchemaGrammar(schemaJSON);
}
exports.createLlamaJsonSchemaGrammar = createLlamaJsonSchemaGrammar;
function createCustomGrammar(filePath) {
    return filePath === undefined
        ? undefined
        : new node_llama_cpp_1.LlamaGrammar({ grammar: filePath });
}
exports.createCustomGrammar = createCustomGrammar;
