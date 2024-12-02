const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const client = new MongoClient(MONGODB_URI);

const modelMappings = {
    rimunace: {
        'gpt-4o': 'gpt-4o',
        'gemini-1.5-pro': 'gemini-1.5-pro',
        'claude-3-5-sonnet': 'claude-3-5-sonnet'
    },
    helixmind: {
        'gpt-4o': 'gpt-4o',
        'gemini-1.5-pro': 'gemini-1.5-pro-002',
        'claude-3-5-sonnet': 'claude-3-5-sonnet-20241022'
    },
    electronhub: {
        'gpt-4o': 'gpt-4o',
        'gemini-1.5-pro': 'gemini-1.5-pro-latest',
        'claude-3-5-sonnet': 'claude-3-5-sonnet-20241022'
    },
    nobrandai: {
        'gpt-4o': 'gpt-4o',
        'gemini-1.5-pro': 'gemini-1.5-pro-002',
        'claude-3-5-sonnet': 'claude-3-5-sonnet-20241022'
    }
};

async function benchmarkProvider(provider) {
    const fetch = (await import('node-fetch')).default;
    const baseUrl = process.env[`${provider}_baseurl`];
    const apiKey = process.env[`${provider}_api_key`];
    
    if (!baseUrl || !apiKey) {
        throw new Error(`Missing configuration for provider ${provider}`);
    }

    const results = [];
    const TIMEOUT_MS = 10000;
    
    for (const [genericModel, providerModel] of Object.entries(modelMappings[provider])) {
        const startTime = Date.now();
        let response, data, error, timedOut = false;
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                controller.abort();
                timedOut = true;
            }, TIMEOUT_MS);

            response = await fetch(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'Origin': 'https://respy.tech'
                },
                body: JSON.stringify({
                    model: providerModel,
                    temperature: 0,
                    messages: [
                        {
                            role: "user",
                            content: "Say `DONE` only."
                        }
                    ]
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            
            if (!timedOut) {
                data = await response.json();
            }
            
        } catch (e) {
            error = timedOut ? 'Request timed out after 10 seconds' : e.message;
        }

        const endTime = Date.now();
        const timeTaken = endTime - startTime;

        results.push({
            provider,
            model: genericModel,
            providerModel,
            timestamp: new Date().toISOString(),
            timeTaken,
            timedOut,
            statusCode: response?.status,
            response: data,
            error,
            rawResponse: response ? {
                headers: Object.fromEntries(response.headers),
                status: response.status,
                statusText: response.statusText
            } : null
        });
    }

    return results;
}

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const adminToken = event.headers['admin-token'];
    
    if (!adminToken || adminToken !== process.env.ADMIN_TOKEN) {
        return {
            statusCode: 401,
            body: JSON.stringify({ error: 'Unauthorized' })
        };
    }

    try {
        await client.connect();
        const db = client.db('benchmark');
        
        // Test providers
        const providers = ['rimunace', 'helixmind', 'electronhub', 'nobrandai'];
        for (const provider of providers) {
            const results = await benchmarkProvider(provider);
            await db.collection(provider).insertMany(results);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    } finally {
        await client.close();
    }
};