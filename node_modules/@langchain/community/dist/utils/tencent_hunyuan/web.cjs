"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sign = void 0;
const sha256_js_1 = __importDefault(require("crypto-js/sha256.js"));
const hmac_sha256_js_1 = __importDefault(require("crypto-js/hmac-sha256.js"));
const common_js_1 = require("./common.cjs");
/**
 * Method that calculate Tencent Cloud API v3 signature
 * for making requests to the Tencent Cloud API.
 * See https://cloud.tencent.com/document/api/1729/101843.
 * @param host Tencent Cloud API host.
 * @param payload HTTP request body.
 * @param timestamp Sign timestamp in seconds.
 * @param secretId Tencent Cloud Secret ID, which can be obtained from https://console.cloud.tencent.com/cam/capi.
 * @param secretKey Tencent Cloud Secret Key, which can be obtained from https://console.cloud.tencent.com/cam/capi.
 * @param headers HTTP request headers.
 * @returns The signature for making requests to the Tencent API.
 */
const sign = (host, payload, timestamp, secretId, secretKey, headers) => {
    const contentType = headers["Content-Type"];
    const payloadHash = (0, sha256_js_1.default)(JSON.stringify(payload));
    const canonicalRequest = `POST\n/\n\ncontent-type:${contentType}\nhost:${host}\n\n${common_js_1.signedHeaders}\n${payloadHash}`;
    const date = (0, common_js_1.getDate)(timestamp);
    const signature = (0, hmac_sha256_js_1.default)(`TC3-HMAC-SHA256\n${timestamp}\n${date}/${common_js_1.service}/tc3_request\n${(0, sha256_js_1.default)(canonicalRequest).toString()}`, (0, hmac_sha256_js_1.default)("tc3_request", (0, hmac_sha256_js_1.default)(common_js_1.service, (0, hmac_sha256_js_1.default)(date, `TC3${secretKey}`)))).toString();
    return `TC3-HMAC-SHA256 Credential=${secretId}/${date}/${common_js_1.service}/tc3_request, SignedHeaders=${common_js_1.signedHeaders}, Signature=${signature}`;
};
exports.sign = sign;
