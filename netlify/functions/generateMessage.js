const fetch = require('node-fetch');

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

    const ragContext = ''; // Populate with necessary data if required

    const apiEndpoint = process.env.apiEndpoint;
    const apiKey = process.env.apiKey;
    
    try {
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model || 'claude-3.5-sonnet',
                messages: [...currentConversation.messages, { role: 'user', content: messageContent }],
                context: ragContext,
                stream: false // Changed to false for non-streaming response
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        // Handle non-streaming response
        const data = await response.json();
        const aiResponse = data.choices[0].message.content;

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