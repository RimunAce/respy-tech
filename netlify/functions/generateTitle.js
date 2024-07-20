const axios = require('axios');

exports.handler = async (event) => {
  const { userMessage, assistantMessage } = JSON.parse(event.body);
  const titlePrompt = `Based on this conversation, suggest a brief title (max 6 words):
  User: ${userMessage}
  Assistant: ${assistantMessage}`;

  const apiEndpoint = process.env.apiEndpoint2 || 'https://fresedgpt.space/v1/chat/completions';
  const apiKey = process.env.apiKey2;

  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server configuration error' }) };
  }

  try {
    const response = await axios.post(apiEndpoint, {
      model: 'gpt-4o',
      messages: [{ role: 'user', content: titlePrompt }]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });

    return { statusCode: 200, body: JSON.stringify(response.data) };
  } catch (error) {
    console.error('Error:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: error.message, 
        details: error.response ? error.response.data : null 
      })
    };
  }
};