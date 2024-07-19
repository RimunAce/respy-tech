const fetch = require('node-fetch');

exports.handler = async (event) => {
    const { userMessage, assistantMessage } = JSON.parse(event.body);
    const titlePrompt = `Based on this conversation, suggest a brief title (max 6 words):
    User: ${userMessage}
    Assistant: ${assistantMessage}`;

    try {
        const response = await fetch(process.env.apiEndpoint2, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.apiKey2}`
            },
            body: JSON.stringify({
                model: 'claude-3.5-sonnet',
                messages: [{ role: 'user', content: titlePrompt }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            return {
                statusCode: response.status,
                body: JSON.stringify({ error: errorData })
            };
        }

        const data = await response.json();
        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
