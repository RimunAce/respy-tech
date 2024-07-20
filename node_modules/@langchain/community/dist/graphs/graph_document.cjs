"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphDocument = exports.Relationship = exports.Node = void 0;
const serializable_1 = require("@langchain/core/load/serializable");
class Node extends serializable_1.Serializable {
    constructor({ id, type = "Node", properties = {}, }) {
        super();
        Object.defineProperty(this, "id", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "type", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Object.defineProperty(this, "properties", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "lc_namespace", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ["langchain", "graph", "document_node"]
        });
        this.id = id;
        this.type = type;
        this.properties = properties;
    }
}
exports.Node = Node;
class Relationship extends serializable_1.Serializable {
    constructor({ source, target, type, properties = {}, }) {
        super();
        Object.defineProperty(this, "source", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "target", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "type", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Object.defineProperty(this, "properties", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "lc_namespace", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ["langchain", "graph", "document_relationship"]
        });
        this.source = source;
        this.target = target;
        this.type = type;
        this.properties = properties;
    }
}
exports.Relationship = Relationship;
class GraphDocument extends serializable_1.Serializable {
    constructor({ nodes, relationships, source, }) {
        super({
            nodes,
            relationships,
            source,
        });
        Object.defineProperty(this, "nodes", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "relationships", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "source", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "lc_namespace", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: ["langchain", "graph", "graph_document"]
        });
        this.nodes = nodes;
        this.relationships = relationships;
        this.source = source;
    }
}
exports.GraphDocument = GraphDocument;
