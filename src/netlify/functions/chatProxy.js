const axios = require('axios');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const requestBody = JSON.parse(event.body);

        const response = await axios({
            method: 'post',
            url: 'https://faas-sgp1-18bc02ac.doserverless.co/api/v1/web/fn-9d095de4-62e3-4a1b-a290-261e62fc3e98/axios/chat-generateMessage',
            data: requestBody,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream',
                'x-api-key': process.env.ALLOWED_API_KEY
            },
            responseType: 'stream'
        });

        return new Promise((resolve, reject) => {
            let responseBody = '';

            response.data.on('data', (chunk) => {
                responseBody += chunk.toString();
            });

            response.data.on('end', () => {
                resolve({
                    statusCode: 200,
                    headers: {
                        'Content-Type': 'text/event-stream',
                        'Cache-Control': 'no-cache',
                        'Connection': 'keep-alive'
                    },
                    body: responseBody
                });
            });

            response.data.on('error', (err) => {
                reject({ statusCode: 500, body: 'Stream Error: ' + err.message });
            });
        });

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to proxy request' })
        };
    }
};