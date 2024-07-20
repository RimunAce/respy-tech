const https = require('https');

const apiEndpoint = process.env.apiEndpoint || 'https://fresedgpt.space/v1/chat/completions';
const apiKey = process.env.apiKey;

function httpsRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, body: JSON.parse(body) }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

exports.handler = async (event) => {
  try {
    const { userMessage, currentConversation, model } = JSON.parse(event.body);

    const messages = [...currentConversation.messages, { role: 'user', content: userMessage }];
    const response = await httpsRequest(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    }, JSON.stringify({
      model: model || "gpt-4o",
      messages,
      temperature: 0.7,
    }));

    if (response.statusCode === 200) {
      return { 
        statusCode: 200, 
        body: JSON.stringify({ aiResponse: response.body.choices[0].message.content })
      };
    } else {
      throw new Error(`API request failed with status ${response.statusCode}`);
    }
  } catch (error) {
    console.error('Error in generateMessage:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate response", details: error.message })
    };
  }
};