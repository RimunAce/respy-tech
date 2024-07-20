const axios = require('axios');

exports.handler = async (event) => {
    const { userMessage, assistantMessage } = JSON.parse(event.body);
    const titlePrompt = `Based on this conversation, suggest a brief title (max 6 words):
    User: ${userMessage}
    Assistant: ${assistantMessage}`;

    const apiEndpoint = process.env.apiEndpoint2 || 'https://api.convoai.tech/v1/chat/completions';
    const apiKey = process.env.apiKey2;

    console.log('API Endpoint:', apiEndpoint);
    console.log('API Key (first 5 chars):', apiKey ? apiKey.substring(0, 5) + '...' : 'undefined');

    if (!apiKey) {
        console.error('API key is missing');
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server configuration error' })
        };
    }

    try {
        const requestBody = {
            model: 'gpt-4o', // Changed from 'claude-3.5-sonnet' to 'gpt-3.5-turbo'
            messages: [{ role: 'user', content: titlePrompt }]
        };

        console.log('Request body:', JSON.stringify(requestBody, null, 2));

        const response = await axios.post(apiEndpoint, requestBody, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            }
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', JSON.stringify(response.headers, null, 2));
        console.log('Response data:', JSON.stringify(response.data, null, 2));

        return {
            statusCode: 200,
            body: JSON.stringify(response.data)
        };
    } catch (error) {
        console.error('Error:', error);
        if (error.response) {
            console.error('Error data:', error.response.data);
            console.error('Error status:', error.response.status);
            console.error('Error headers:', error.response.headers);
        } else if (error.request) {
            console.error('Error request:', error.request);
        } else {
            console.error('Error message:', error.message);
        }
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message, details: error.response ? error.response.data : null })
        };
    }
};