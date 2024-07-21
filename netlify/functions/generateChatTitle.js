const axios = require('axios');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { userFirstMessage, assistantFirstMessage } = JSON.parse(event.body);
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        messages: [
          {
            role: "system",
            content: "Generate a short chat summary (5 words max) for this conversation based on the user's first message and assistant's first response. (DO NOT ADD \".\" AT THE END)"
          },
          { role: "user", content: userFirstMessage },
          { role: "assistant", content: assistantFirstMessage }
        ],
        model: "gpt-4o-mini",
        max_tokens: 20,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.openAiKey}`
        }
      }
    );

    const generatedTitle = response.data.choices[0].message.content.trim();
    const limitedTitle = generatedTitle.split(" ").slice(0, 16).join(" ");

    return {
      statusCode: 200,
      body: JSON.stringify({ title: limitedTitle })
    };
  } catch (error) {
    console.error('Error generating title:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate title' })
    };
  }
};