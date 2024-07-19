const fetch = require('node-fetch');

exports.handler = async (event) => {
    const { userMessage, currentConversation, uploadedFiles } = JSON.parse(event.body);

    // Validate the incoming payload
    if (!userMessage || (!uploadedFiles.length && userMessage.trim() === '')) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'User message cannot be empty' })
        };
    }

    let messageContent = userMessage;
    if (uploadedFiles.length > 0) {
        messageContent += "\n\nAttached files:\n";
        for (const file of uploadedFiles) {
            messageContent += `- ${file.name}\n`;
        }
    }

    // Construct the RAG Context if needed.
    const ragContext = ''; // populate it with necessary data if required

    const apiEndpoint = process.env.apiEndpoint; // Environment variables for your API endpoint
    const apiKey = process.env.apiKey; // API key from environment variables
    
    try {
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: currentConversation.model, // Ensure the correct model is included here
                messages: [...currentConversation.messages, { role: 'user', content: messageContent }],
                context: ragContext,
                stream: true
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let aiResponse = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        if (data.choices && data.choices[0].delta.content) {
                            aiResponse += data.choices[0].delta.content;
                        }
                    } catch (jsonError) {
                        console.error('Error parsing JSON:', jsonError);
                    }
                }
            }
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
