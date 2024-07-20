const fetch = require('node-fetch');
const url = require('url');

exports.handler = async (event) => {
    const { userMessage, currentConversation, uploadedFiles, model } = JSON.parse(event.body);

    if (!userMessage && uploadedFiles.length === 0) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'User message cannot be empty' })
        };
    }

    let messageContent = userMessage;
    if (uploadedFiles.length > 0) {
        messageContent += "\n\nAttached files:\n";
        uploadedFiles.forEach(file => {
            messageContent += `- ${file.name}\n`;
        });
    }

    const apiEndpoint = process.env.apiEndpoint;
    const apiKey = process.env.apiKey;

    if (!apiEndpoint || !apiKey) {
        console.error('API endpoint or key is missing');
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server configuration error' })
        };
    }

    // Ensure the API endpoint is an absolute URL
    const fullApiEndpoint = url.resolve('https://', apiEndpoint);
    
    try {
        const response = await fetch(fullApiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model || 'claude-3.5-sonnet',
                messages: [
                    ...currentConversation.messages,
                    { role: 'user', content: messageContent }
                ],
                max_tokens: 1000,
                temperature: 0.7,
                stream: false
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('API Error Response:', errorData);
            throw new Error(`API Error: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        console.log('API Success Response:', data);

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