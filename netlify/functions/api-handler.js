const { getFromCache, setToCache } = require('./utils/redis-client');
const dotenv = require('dotenv');

dotenv.config();

const fetchWithTimeout = async (url, fetchOptions, timeout = 5000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Respy.Tech/1.0',
        'Origin': 'https://respy.tech',
        ...fetchOptions?.headers
      },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    clearTimeout(timeoutId);
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out after 5 seconds');
    }
    throw error;
  }
};

exports.handler = async (event, context) => {
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

  const provider = event.path.split('/').pop();
  const cacheKey = `provider:${provider}:models`;

  try {
    // Check Redis cache first
    const cachedData = await getFromCache(cacheKey);
    if (cachedData) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ data: cachedData, source: 'cache' })
      };
    }

    // If not in cache, fetch from API
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
      helixmind: 'https://helixmind.online/v1/models',
      hareproxy: 'https://unified.hareproxy.io.vn/v1/models',
      'g4f.pro': 'https://g4f.pro/v1/models',
      webraftai: 'https://api.webraft.in/v2/models',
      nobrandai: 'https://nobrandai.com/v1/models',
      voidai: 'https://voidai.xyz/v1/models'
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

    const fetchOptions = {};
    if (proxyHost && proxyPort) {
      fetchOptions.agent = new (await import('https-proxy-agent')).HttpsProxyAgent({
        host: proxyHost,
        port: proxyPort,
        auth: proxyAuth,
        protocol: 'http:'
      });
    }

    const data = await fetchWithTimeout(apiEndpoints[provider], fetchOptions);
    
    // Validate data structure before caching
    if (Array.isArray(data?.data)) {
      // Cache valid data with provider-specific TTL
      const ttl = provider === 'rimunace' ? 600 : 300; // 10 mins for rimunace, 5 mins for others
      await setToCache(cacheKey, data.data, ttl);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ data: data.data, source: 'api' })
      };
    } else {
      throw new Error('Invalid data structure received from provider');
    }

  } catch (error) {
    console.error(`Error fetching ${provider}:`, error);

    const staleData = await getFromCache(`stale:${cacheKey}`);
    if (staleData) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          data: staleData, 
          source: 'stale_cache',
          warning: 'Using stale data due to provider error'
        })
      };
    }

    return {
      statusCode: error.message.includes('timed out') ? 504 : 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        provider 
      })
    };
  }
};