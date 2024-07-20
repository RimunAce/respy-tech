"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TencentHunyuanEmbeddings = void 0;
const index_js_1 = require("../../utils/tencent_hunyuan/index.cjs");
const base_js_1 = require("./base.cjs");
/**
 * Class for generating embeddings using the Tencent Hunyuan API.
 */
class TencentHunyuanEmbeddings extends base_js_1.TencentHunyuanEmbeddings {
    constructor(fields) {
        super({ ...fields, sign: index_js_1.sign } ?? { sign: index_js_1.sign });
    }
}
exports.TencentHunyuanEmbeddings = TencentHunyuanEmbeddings;
