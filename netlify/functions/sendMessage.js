const https = require('https');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    const { messages } = JSON.parse(event.body);

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

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            if (res.statusCode === 200) {
                resolve({
                    statusCode: 200,
                    headers: {
                        'Content-Type': 'text/event-stream',
                        'Cache-Control': 'no-cache',
                        'Connection': 'keep-alive'
                    },
                    body: res
                });
            } else {
                let responseBody = '';
                res.on('data', (chunk) => {
                    responseBody += chunk;
                });
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        body: JSON.stringify({
                            error: `Request failed with status code ${res.statusCode}`,
                            details: responseBody
                        })
                    });
                });
            }
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