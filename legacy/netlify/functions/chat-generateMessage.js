const axios = require('axios');

// Configuration for different models and their respective APIs
const MODEL_CONFIG = [
  { name: "meta-llama/Meta-Llama-3.1-405B-Instruct", endpoint: 'https://shadowjourney.us.to/v2/chat/completions', api: 'shadowjourney' },
  { name: "gpt-4o-mini", endpoint: 'https://shadowjourney.us.to/v1/chat/completions', api: 'shadowjourney' },
  { name: "gpt-4o-mini", endpoint: 'https://api.openai.com/v1/chat/completions', api: 'openai' },
];

// Timeout duration for API requests (in milliseconds)
const REQUEST_TIMEOUT = 8000;

// Retry mechanism with exponential backoff
const retryWithExponentialBackoff = async (fn, maxRetries = 3, initialDelay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, initialDelay * Math.pow(2, i)));
    }
  }
};

// Enhanced error logging
const logError = (modelName, error) => {
  console.error(`Error with model ${modelName}:`, {
    message: error.message,
    stack: error.stack,
    modelName,
    timestamp: new Date().toISOString()
  });
};

// Main handler function
exports.handler = async function (event, context) {
  try {
    // Validate HTTP method
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    // Parse and log incoming messages
    const { messages } = JSON.parse(event.body);
    console.log("Received messages:", JSON.stringify(messages));

    // Try each model in sequence
    for (const modelInfo of MODEL_CONFIG) {
      try {
        const response = await handleModelRequest(modelInfo, messages);
        if (response) return response;
      } catch (error) {
        logError(modelInfo.name, error);
        // Continue to next model if this one fails
      }
    }

    // If all models fail, return a generic error message
    return createErrorResponse("All models are currently unavailable. Please try again later.");

  } catch (error) {
    console.error('Unexpected error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
  }
};

// Function to handle model requests
const handleModelRequest = async (modelInfo, messages) => {
  return await retryWithExponentialBackoff(() => 
    makeAxiosRequest(messages, modelInfo)
  );
};

// Function for making API requests using axios
async function makeAxiosRequest(messages, modelInfo) {
  const { name: model, endpoint, api } = modelInfo;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${api === 'openai' ? process.env.openAiKey : process.env.apiKey2}`
  };

  try {
    const response = await axios({
      method: 'post',
      url: endpoint,
      data: {
        model: model,
        messages: [{ role: "system", content: "You are a helpful assistant." }, ...messages],
        stream: true
      },
      headers: headers,
      responseType: 'stream',
      timeout: REQUEST_TIMEOUT
    });

    return handleStreamingResponse(response, model);
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw new Error(`Request to ${model} timed out after ${REQUEST_TIMEOUT}ms`);
    }
    throw error;
  }
}

// Function to handle streaming responses
const handleStreamingResponse = (response, model) => {
  return new Promise((resolve, reject) => {
    let responseBody = '';
    response.data.on('data', chunk => {
      responseBody += chunk.toString();
      // Process and send each chunk to the client
      // This depends on your specific requirements for real-time updates
      // For example:
      // sendChunkToClient(chunk.toString());
    });

    response.data.on('end', () => {
      console.log(`Received response from API (${model}) with status:`, response.status);
      if (response.status !== 200) {
        console.log(`Error response from API (${model}):`, responseBody);
        reject(new Error(`Request failed with status code ${response.status}`));
      } else {
        resolve(createSuccessResponse(responseBody));
      }
    });

    response.data.on('error', error => {
      logError(model, error);
      reject(error);
    });
  });
};

// Helper function to create a success response object
function createSuccessResponse(body) {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    },
    body: body
  };
}

// Helper function to create an error response object
function createErrorResponse(message) {
  return {
    statusCode: 503,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    },
    body: `data: {"choices": [{"delta": {"content": "${message}"}}]}\n\ndata: [DONE]\n`
  };
}