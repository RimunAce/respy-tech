const https = require('https');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    const { messages } = JSON.parse(event.body);
    console.log("Received messages:", JSON.stringify(messages)); // Log incoming messages

    const data = JSON.stringify({
        model: "meta-llama/Meta-Llama-3-70B-Instruct",
        messages: [{
                role: "system",
                content: "You are a helpful assistant."
            },
            ...messages
        ],
        stream: true
    });

    const options = {
        hostname: 'shadowjourney.us.to',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.apiKey2}`
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let responseBody = '';

            res.on('data', (chunk) => {
                responseBody += chunk.toString();
            });

            res.on('end', () => {
                console.log("Received response from OpenAI with status:", res.statusCode); // Log response status
                console.log("Response Body:", responseBody); // Log the full response body

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