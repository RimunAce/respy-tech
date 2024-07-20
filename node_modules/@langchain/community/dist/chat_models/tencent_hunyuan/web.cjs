"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatTencentHunyuan = void 0;
const web_js_1 = require("../../utils/tencent_hunyuan/web.cjs");
const base_js_1 = require("./base.cjs");
/**
 * Wrapper around Tencent Hunyuan large language models that use the Chat endpoint.
 *
 * To use you should have the `TENCENT_SECRET_ID` and `TENCENT_SECRET_KEY`
 * environment variable set.
 *
 * @augments BaseLLM
 * @augments TencentHunyuanInput
 * @example
 * ```typescript
 * const messages = [new HumanMessage("Hello")];
 *
 * const hunyuanLite = new ChatTencentHunyuan({
 *   model: "hunyuan-lite",
 *   tencentSecretId: "YOUR-SECRET-ID",
 *   tencentSecretKey: "YOUR-SECRET-KEY",
 * });
 *
 * let res = await hunyuanLite.call(messages);
 *
 * const hunyuanPro = new ChatTencentHunyuan({
 *   model: "hunyuan-pro",
 *   temperature: 1,
 *   tencentSecretId: "YOUR-SECRET-ID",
 *   tencentSecretKey: "YOUR-SECRET-KEY",
 * });
 *
 * res = await hunyuanPro.call(messages);
 * ```
 */
class ChatTencentHunyuan extends base_js_1.ChatTencentHunyuan {
    constructor(fields) {
        super({ ...fields, sign: web_js_1.sign } ?? { sign: web_js_1.sign });
    }
}
exports.ChatTencentHunyuan = ChatTencentHunyuan;
