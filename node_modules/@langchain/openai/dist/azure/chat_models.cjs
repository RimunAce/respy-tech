"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzureChatOpenAI = void 0;
const openai_1 = require("openai");
const chat_models_js_1 = require("../chat_models.cjs");
const azure_js_1 = require("../utils/azure.cjs");
class AzureChatOpenAI extends chat_models_js_1.ChatOpenAI {
    _llmType() {
        return "azure_openai";
    }
    get lc_aliases() {
        return {
            openAIApiKey: "openai_api_key",
            openAIApiVersion: "openai_api_version",
            openAIBasePath: "openai_api_base",
        };
    }
    constructor(fields) {
        const newFields = fields ? { ...fields } : fields;
        if (newFields) {
            // don't rewrite the fields if they are already set
            newFields.azureOpenAIApiDeploymentName =
                newFields.azureOpenAIApiDeploymentName ?? newFields.deploymentName;
            newFields.azureOpenAIApiKey =
                newFields.azureOpenAIApiKey ?? newFields.openAIApiKey;
            newFields.azureOpenAIApiVersion =
                newFields.azureOpenAIApiVersion ?? newFields.openAIApiVersion;
        }
        super(newFields);
    }
    getLsParams(options) {
        const params = super.getLsParams(options);
        params.ls_provider = "azure";
        return params;
    }
    _getClientOptions(options) {
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
        const requestOptions = {
            ...this.clientConfig,
            ...options,
        };
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
        return requestOptions;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toJSON() {
        const json = super.toJSON();
        function isRecord(obj) {
            return typeof obj === "object" && obj != null;
        }
        if (isRecord(json) && isRecord(json.kwargs)) {
            delete json.kwargs.azure_openai_base_path;
            delete json.kwargs.azure_openai_api_deployment_name;
            delete json.kwargs.azure_openai_api_key;
            delete json.kwargs.azure_openai_api_version;
            delete json.kwargs.azure_open_ai_base_path;
        }
        return json;
    }
}
exports.AzureChatOpenAI = AzureChatOpenAI;
