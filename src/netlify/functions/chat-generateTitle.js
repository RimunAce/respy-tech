const https = require('https');

// Configuration for the Llama 3.1 model
const MODEL_CONFIG = {
  name: "gpt-4o-mini",
  endpoint: '/v1/chat/completions',
  hostname: 'shadowjourney.us.to'
};

// Maximum number of words in the generated title
const MAX_TITLE_WORDS = 5;

// Timeout for the API request (in milliseconds)
const REQUEST_TIMEOUT = 10000;

exports.handler = async function(event, context) {
  // Validate HTTP method
  if (event.httpMethod !== 'POST') {
    return createResponse(405, { error: 'Method Not Allowed' });
  }

  try {
    const { userFirstMessage, assistantFirstMessage } = JSON.parse(event.body);
    
    const titleResponse = await makeRequest(userFirstMessage, assistantFirstMessage);
    
    const generatedTitle = titleResponse.choices[0].message.content.trim();
    const limitedTitle = generatedTitle.split(" ").slice(0, MAX_TITLE_WORDS).join(" ");

    return createResponse(200, { title: limitedTitle });
  } catch (error) {
    console.error('Error generating title:', error);
    return createResponse(500, { error: 'Failed to generate title' });
  }
};

function makeRequest(userFirstMessage, assistantFirstMessage) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: MODEL_CONFIG.hostname,
      path: MODEL_CONFIG.endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.apiKey2}`
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(new Error('Failed to parse API response'));
          }
        } else {
          reject(new Error(`API request failed with status ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(REQUEST_TIMEOUT, () => reject(new Error('Request timed out')));

    req.write(JSON.stringify({
      model: MODEL_CONFIG.name,
      messages: [
        {
          role: "system",
          content: "Generate a short chat summary (5 words max) for this conversation based on the user's first message and assistant's first response. (DO NOT ADD \".\" AT THE END)"
        },
        { role: "user", content: userFirstMessage },
        { role: "assistant", content: assistantFirstMessage }
      ],
      max_tokens: 20
    }));

    req.end();
  });
}

function createResponse(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  };
}