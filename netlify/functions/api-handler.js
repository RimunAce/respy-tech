let rateLimiter;
const dotenv = require('dotenv');

dotenv.config();

exports.handler = async (event, context) => {
  if (!rateLimiter) {
    const rateLimit = await import('lambda-rate-limiter');
    rateLimiter = rateLimit.default({
      interval: 60000,
      uniqueTokenPerInterval: 500
    });
  }

  const headers = {
    'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' 
      ? 'http://localhost:8888' 
      : 'https://respy.tech',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  const ip = event.headers['client-ip'] || 
             event.headers['x-forwarded-for'] || 
             event.ip;

  try {
    await rateLimiter.check(30, ip);

    const provider = event.path.split('/').pop();
    
    const apiEndpoints = {
      rimunace: 'https://api.rimunace.xyz/v1/models',
      zanity: 'https://api.zanity.net/v1/models',
      anyai: 'https://api.llmplayground.net/v1/models',
      cablyai: 'https://cablyai.com/v1/models',
      fresedgpt: 'https://fresedgpt.space/v1/models',
      heckerai: 'https://heckerai.com/v1/models',
      shardai: 'https://api.shard-ai.xyz/v1/models',
      zukijourney: 'https://zukijourney.xyzbot.net/v1/models',
      shadowjourney: 'https://shadowjourney.xyz/v1/models',
      shuttleai: 'https://api.shuttleai.app/v1/models',
      electronhub: 'https://api.electronhub.top/v1/models',
      oxygen: 'https://app.oxyapi.uk/v1/models',
      nagaai: 'https://api.naga.ac/v1/models',
      skailar: 'https://test.skailar.it/v1/models',
      helixmind: 'https://helixmind.online/v1/models'
    };

    if (!apiEndpoints[provider]) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid provider' })
      };
    }

    const proxyHost = process.env.proxy_host;
    const proxyPort = process.env.proxy_port;
    const proxyAuth = process.env.proxy_auth;

    try {
      const fetchOptions = {};
      if (proxyHost && proxyPort) {
        fetchOptions.agent = new (await import('https-proxy-agent')).HttpsProxyAgent({
          host: proxyHost,
          port: proxyPort,
          auth: proxyAuth,
          protocol: 'http:'
        });
      }

      const response = await fetch(apiEndpoints[provider], fetchOptions);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data)
      };

    } catch (error) {
      if (error.message && error.message.includes('Rate limit exceeded')) {
        return {
          statusCode: 429,
          headers,
          body: JSON.stringify({ 
            error: 'Too many requests. Please try again later.',
            retryAfter: 60 
          })
        };
      }

      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: error.message })
      };
    }

  } catch (error) {
    if (error.message && error.message.includes('Rate limit exceeded')) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({ 
          error: 'Too many requests. Please try again later.',
          retryAfter: 60
        })
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};