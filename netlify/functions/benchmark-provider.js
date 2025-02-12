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
    },
    fresedgpt: {
        'gpt-4o': 'gpt-4o',
        'gemini-1.5-pro': 'gemini-1.5-pro-002',
        'claude-3-5-sonnet': 'claude-3-5-sonnet-20241022'
    },
    cablyai: {
        "gpt-4o": "gpt-4o",
        "gemini-1.5-pro": "gemini-1.5-pro",
        "claude-3-5-sonnet": "claude-3-5-sonnet-20241022"
    }
};

async function benchmarkProvider(provider) {
    const fetch = (await import('node-fetch')).default;
    const baseUrl = process.env[`${provider}_baseurl`];
    const apiKey = process.env[`${provider}_api_key`];
    
    if (!baseUrl || !apiKey) {
        throw new Error(`Missing configuration for provider ${provider}`);
    }

    const TIMEOUT_MS = 10000;
    
    const testPromises = Object.entries(modelMappings[provider]).map(async ([genericModel, providerModel]) => {
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
                
                const isValidResponse = data && 
                    data.choices && 
                    Array.isArray(data.choices) && 
                    data.choices.length > 0 &&
                    data.choices[0].message &&
                    typeof data.choices[0].message.content === 'string' &&
                    data.choices[0].message.content.trim() !== '';

                if (!isValidResponse) {
                    error = 'Invalid or empty response from model';
                    response.status = 503;
                }
            }
            
        } catch (e) {
            error = timedOut ? 'Request timed out after 10 seconds' : e.message;
        }

        const endTime = Date.now();
        const timeTaken = endTime - startTime;

        return {
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
        };
    });

    return Promise.all(testPromises);
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
        
        const providers = ['rimunace', 'helixmind', 'electronhub', 'nobrandai', 'fresedgpt', 'cablyai'];
        
        // Run all provider benchmarks concurrently
        const benchmarkPromises = providers.map(async (provider) => {
            try {
                const results = await benchmarkProvider(provider);
                await db.collection(provider).insertMany(results);
                return { provider, success: true };
            } catch (error) {
                return { provider, success: false, error: error.message };
            }
        });

        const results = await Promise.all(benchmarkPromises);

        return {
            statusCode: 200,
            body: JSON.stringify({ results })
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