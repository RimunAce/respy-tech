const axios = require('axios');

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

    async function makeRequest(requestModel) {
        const messages = [
            ...currentConversation.messages,
            { role: 'user', content: messageContent }
        ];

        const requestBody = {
            model: requestModel,
            messages: messages,
            temperature: 0.7,
        };

        console.log(`Making request with model: ${requestModel}`);
        console.log('Request body:', JSON.stringify(requestBody, null, 2));

        try {
            const response = await axios.post(apiEndpoint, requestBody, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                }
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', JSON.stringify(response.headers, null, 2));
            console.log('Response data:', JSON.stringify(response.data, null, 2));

            if (response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
                return response.data.choices[0].message.content;
            } else {
                throw new Error('Unexpected API response format');
            }
        } catch (error) {
            console.error(`Error with model ${requestModel}:`, error.message);
            if (error.response) {
                console.error('Error data:', error.response.data);
                console.error('Error status:', error.response.status);
                console.error('Error headers:', error.response.headers);
            }
            throw error;
        }
    }

    try {
        // First attempt with the user-selected model
        const aiResponse = await makeRequest(model || "gpt-4o");
        return {
            statusCode: 200,
            body: JSON.stringify({ aiResponse })
        };
    } catch (error) {
        console.error('First attempt failed:', error.message);
        
        // If the first attempt fails, try with gpt-4o
        if (model !== "gpt-4o") {
            try {
                console.log('Attempting fallback to gpt-4o');
                const fallbackResponse = await makeRequest("gpt-4o");
                return {
                    statusCode: 200,
                    body: JSON.stringify({ aiResponse: fallbackResponse, usedFallbackModel: true })
                };
            } catch (fallbackError) {
                console.error('Fallback attempt failed:', fallbackError.message);
            }
        }

        // If both attempts fail, return an error
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: "Failed to generate response", 
                details: error.message,
                apiErrorDetails: error.response ? error.response.data : null
            })
        };
    }
};