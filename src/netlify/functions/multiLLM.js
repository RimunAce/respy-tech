const axios = require('axios');

// API configuration
const API_URL = 'https://api.electronhub.top';
const API_KEY = process.env.electronKey; // Use uppercase for environment variables
const API_ENDPOINT = '/v1/chat/completions';

// Constants
const REQUEST_TIMEOUT_MS = 20000; // 20 seconds in milliseconds
const HTTP_METHOD_POST = 'POST';
const HTTP_STATUS = {
  OK: 200,
  METHOD_NOT_ALLOWED: 405,
  INTERNAL_SERVER_ERROR: 500
};

// Create a reusable axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  }
});

/**
 * Handles the incoming request and returns the API response
 * @param {Object} event - The incoming event object
 * @returns {Promise<Object>} The response object
 */
exports.handler = async (event) => {
  if (event.httpMethod !== HTTP_METHOD_POST) {
    return createErrorResponse(HTTP_STATUS.METHOD_NOT_ALLOWED, 'Method Not Allowed');
  }
  return handlePostRequest(event);
};

async function handlePostRequest(event) {
  try {
    const { model, messages } = JSON.parse(event.body);
    const response = await makeApiRequest(model, messages);
    return createSuccessResponse(response.data);
  } catch (error) {
    return handleApiError(error);
  }
}

async function makeApiRequest(model, messages) {
  return apiClient.post(API_ENDPOINT, { model, messages });
}

function handleApiError(error) {
  console.error('Error in function:', error);
  return createErrorResponse(
    error.response?.status || HTTP_STATUS.INTERNAL_SERVER_ERROR,
    error.message || 'Internal Server Error',
    error.response?.data
  );
}

/**
 * Creates a success response object
 * @param {Object} data - The response data
 * @returns {Object} The formatted success response
 */
function createSuccessResponse(data) {
  return {
    statusCode: HTTP_STATUS.OK,
    body: JSON.stringify(data)
  };
}

/**
 * Creates an error response object
 * @param {number} statusCode - The HTTP status code
 * @param {string} message - The error message
 * @param {Object} [details] - Additional error details
 * @returns {Object} The formatted error response
 */
function createErrorResponse(statusCode, message, details = {}) {
  return {
    statusCode,
    body: JSON.stringify({
      error: message,
      details
    })
  };
}