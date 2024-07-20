"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sign = void 0;
const node_crypto_1 = require("node:crypto");
const common_js_1 = require("./common.cjs");
const sha256 = (data) => (0, node_crypto_1.createHash)("sha256").update(data).digest("hex");
const hmacSha256 = (data, key) => (0, node_crypto_1.createHmac)("sha256", key).update(data).digest();
const hmacSha256Hex = (data, key) => (0, node_crypto_1.createHmac)("sha256", key).update(data).digest("hex");
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
    const payloadHash = sha256(JSON.stringify(payload));
    const canonicalRequest = `POST\n/\n\ncontent-type:${contentType}\nhost:${host}\n\n${common_js_1.signedHeaders}\n${payloadHash}`;
    const date = (0, common_js_1.getDate)(timestamp);
    const signature = hmacSha256Hex(`TC3-HMAC-SHA256\n${timestamp}\n${date}/${common_js_1.service}/tc3_request\n${sha256(canonicalRequest)}`, hmacSha256("tc3_request", hmacSha256(common_js_1.service, hmacSha256(date, `TC3${secretKey}`))));
    return `TC3-HMAC-SHA256 Credential=${secretId}/${date}/${common_js_1.service}/tc3_request, SignedHeaders=${common_js_1.signedHeaders}, Signature=${signature}`;
};
exports.sign = sign;
