const https = require('https');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    const { messages } = JSON.parse(event.body);
    console.log("Received messages:", JSON.stringify(messages));

    const data = JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{
                role: "system",
                content: "You are a helpful assistant."
            },
            ...messages
        ],
        stream: true
    });

    const options = {
        hostname: 'api.openai.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.openAiKey}`
        }
    };

    console.log("Sending request to OpenAI with options:", JSON.stringify(options));

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            console.log("Received response from OpenAI with status:", res.statusCode);
            
            let responseBody = '';

            res.on('data', (chunk) => {
                responseBody += chunk.toString();
            });

            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve({
                        statusCode: 200,
                        headers: {
                            'Content-Type': 'text/event-stream',
                            'Cache-Control': 'no-cache',
                            'Connection': 'keep-alive'
                        },
                        body: responseBody
                    });
                } else {
                    console.log("Error response from OpenAI:", responseBody);
                    resolve({
                        statusCode: res.statusCode,
                        body: JSON.stringify({
                            error: `Request failed with status code ${res.statusCode}`,
                            details: responseBody
                        })
                    });
                }
            });
        });

        req.on('error', (error) => {
            console.error('Error sending message:', error);
            resolve({
                statusCode: 500,
                body: JSON.stringify({
                    error: 'Failed to send message',
                    details: error.message
                })
            });
        });

        req.write(data);
        req.end();
    });
};