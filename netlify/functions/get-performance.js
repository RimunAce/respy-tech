const { MongoClient } = require('mongodb');

exports.handler = async function(event, context) {
    const { provider, model } = event.queryStringParameters;
    
    const supportedProviders = ['rimunace', 'helixmind', 'electronhub', 'nobrandai', 'zukijourney', 'fresedgpt', 'g4fpro'];
    
    if (!supportedProviders.includes(provider)) {
        return {
            statusCode: 400,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                error: 'Provider not supported for performance metrics'
            })
        };
    }

    const client = new MongoClient(process.env.MONGODB_URI);

    try {
        await client.connect();
        const db = client.db('benchmark');
        
        const results = await db.collection(provider)
            .find({ model })
            .sort({ timestamp: -1 })
            .limit(100)
            .project({
                timestamp: 1,
                timeTaken: 1,
                statusCode: 1,
                error: 1,
                response: 1
            })
            .toArray();

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ results })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: error.message })
        };
    } finally {
        await client.close();
    }
}; 