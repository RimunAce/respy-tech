export declare const service = "hunyuan";
export declare const signedHeaders = "content-type;host";
export declare const getDate: (timestamp: number) => string;
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
export type sign = (host: string, payload: object, timestamp: number, secretId: string, secretKey: string, headers: Record<string, string>) => string;
