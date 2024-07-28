const axios = require('axios');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const apiKey = process.env.ALLOWED_API_KEY;
  if (!apiKey) {
    console.error('API key is not set in environment variables');
    return { statusCode: 500, body: JSON.stringify({ error: 'Server configuration error' }) };
  }

  try {
    const response = await axios.post(
      'https://faas-sgp1-18bc02ac.doserverless.co/api/v1/web/fn-9d095de4-62e3-4a1b-a290-261e62fc3e98/axios/zenith-response',
      JSON.parse(event.body),
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        }
      }
    );

    return {
      statusCode: response.status,
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    console.error('Error details:', error.response ? error.response.data : error.message);
    return {
      statusCode: error.response ? error.response.status : 500,
      body: JSON.stringify({ 
        error: 'Failed to fetch response',
        details: error.response ? error.response.data : error.message
      })
    };
  }
};