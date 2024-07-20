const https = require('https');

const apiEndpoint = process.env.apiEndpoint2 || 'https://fresedgpt.space/v1/chat/completions';
const apiKey = process.env.apiKey2;

exports.handler = async (event) => {
  const { userMessage, assistantMessage } = JSON.parse(event.body);
  const titlePrompt = `Based on this conversation, suggest a brief title (max 6 words):
  User: ${userMessage}
  Assistant: ${assistantMessage}`;

  try {
    const response = await new Promise((resolve, reject) => {
      const req = https.request(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      });
      req.on('error', reject);
      req.write(JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: titlePrompt }]
      }));
      req.end();
    });

    return { statusCode: 200, body: JSON.stringify(response) };
  } catch (error) {
    console.error('Error:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};