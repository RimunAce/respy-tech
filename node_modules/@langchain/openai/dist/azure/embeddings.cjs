"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzureOpenAIEmbeddings = void 0;
const openai_1 = require("openai");
const embeddings_js_1 = require("../embeddings.cjs");
const azure_js_1 = require("../utils/azure.cjs");
const openai_js_1 = require("../utils/openai.cjs");
class AzureOpenAIEmbeddings extends embeddings_js_1.OpenAIEmbeddings {
    constructor(fields, configuration) {
        const newFields = { ...fields };
        if (Object.entries(newFields).length) {
            // don't rewrite the fields if they are already set
            newFields.azureOpenAIApiDeploymentName =
                newFields.azureOpenAIApiDeploymentName ?? newFields.deploymentName;
            newFields.azureOpenAIApiKey =
                newFields.azureOpenAIApiKey ?? newFields.apiKey;
            newFields.azureOpenAIApiVersion =
                newFields.azureOpenAIApiVersion ?? newFields.openAIApiVersion;
        }
        super(newFields, configuration);
    }
    async embeddingWithRetry(request) {
        if (!this.client) {
            const openAIEndpointConfig = {
                azureOpenAIApiDeploymentName: this.azureOpenAIApiDeploymentName,
                azureOpenAIApiInstanceName: this.azureOpenAIApiInstanceName,
                azureOpenAIApiKey: this.azureOpenAIApiKey,
                azureOpenAIBasePath: this.azureOpenAIBasePath,
                azureADTokenProvider: this.azureADTokenProvider,
                baseURL: this.clientConfig.baseURL,
            };
            const endpoint = (0, azure_js_1.getEndpoint)(openAIEndpointConfig);
            const params = {
                ...this.clientConfig,
                baseURL: endpoint,
                timeout: this.timeout,
                maxRetries: 0,
            };
            if (!this.azureADTokenProvider) {
                params.apiKey = openAIEndpointConfig.azureOpenAIApiKey;
            }
            if (!params.baseURL) {
                delete params.baseURL;
            }
            params.defaultHeaders = {
                ...params.defaultHeaders,
                "User-Agent": params.defaultHeaders?.["User-Agent"]
                    ? `${params.defaultHeaders["User-Agent"]}: langchainjs-azure-openai-v2`
                    : `langchainjs-azure-openai-v2`,
            };
            this.client = new openai_1.AzureOpenAI({
                apiVersion: this.azureOpenAIApiVersion,
                azureADTokenProvider: this.azureADTokenProvider,
                deployment: this.azureOpenAIApiDeploymentName,
                ...params,
            });
        }
        const requestOptions = {};
        if (this.azureOpenAIApiKey) {
            requestOptions.headers = {
                "api-key": this.azureOpenAIApiKey,
                ...requestOptions.headers,
            };
            requestOptions.query = {
                "api-version": this.azureOpenAIApiVersion,
                ...requestOptions.query,
            };
        }
        return this.caller.call(async () => {
            try {
                const res = await this.client.embeddings.create(request, requestOptions);
                return res;
            }
            catch (e) {
                const error = (0, openai_js_1.wrapOpenAIClientError)(e);
                throw error;
            }
        });
    }
}
exports.AzureOpenAIEmbeddings = AzureOpenAIEmbeddings;
