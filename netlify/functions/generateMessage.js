const fetch = require('node-fetch');

exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    const { userMessage, currentConversation, uploadedFiles, model } = JSON.parse(event.body);

    console.log('Parsed request body:', { userMessage, currentConversation, uploadedFiles, model });

    let messageContent = userMessage;
    if (uploadedFiles.length > 0) {
        messageContent += "\n\nAttached files:\n";
        uploadedFiles.forEach(file => {
            messageContent += `- ${file.name}\n`;
        });
    }

    const apiEndpoint = process.env.apiEndpoint || 'https://api.convoai.tech/v1/chat/completions';
    const apiKey = process.env.apiKey;

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
        const messages = [
            ...currentConversation.messages,
            { role: 'user', content: messageContent }
        ];

        const requestBody = {
            messages: messages,
            model: model || 'claude-3.5-sonnet',
            temperature: 0.7
        };

        console.log('Request body:', JSON.stringify(requestBody, null, 2));

        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', JSON.stringify(response.headers.raw(), null, 2));

        const responseText = await response.text();
        console.log('Response text:', responseText);

        if (!response.ok) {
            const errorData = JSON.parse(responseText);
            throw new Error(`API Error: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const data = JSON.parse(responseText);
        console.log('Parsed API response:', JSON.stringify(data, null, 2));

        let aiResponse;
        if (data.choices && data.choices[0] && data.choices[0].message) {
            aiResponse = data.choices[0].message.content;
        } else {
            throw new Error('Unexpected API response format');
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ aiResponse })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};