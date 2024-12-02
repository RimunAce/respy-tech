const Redis = require('ioredis');
const dotenv = require('dotenv');

dotenv.config();

let redisClient = null;
let isConnecting = false;
let connectionTimeout = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;

const REDIS_CONFIG = {
  maxRetriesPerRequest: 3,
  connectTimeout: 10000,
  commandTimeout: 5000,
  enableReadyCheck: true,
  lazyConnect: true,
  retryStrategy(times) {
    console.log(`Retry attempt ${times}`);
    if (times > 3) {
      console.error('Redis retry limit reached');
      return null;
    }
    return Math.min(times * 1000, 3000);
  },
  reconnectOnError(err) {
    console.error('Redis reconnection error:', err);
    return false;
  }
};

async function createRedisClient() {
  if (redisClient?.status === 'ready') return redisClient;
  if (isConnecting) return waitForConnection();

  isConnecting = true;
  clearTimeout(connectionTimeout);
  reconnectAttempts++;

  try {
    console.log('Creating new Redis client...');
    const client = new Redis(process.env.REDIS_URI, REDIS_CONFIG);

    client.on('connecting', () => {
      console.log('🔄 Connecting to Redis...');
    });

    client.on('connect', () => {
      console.log('✅ Connected to Redis');
      clearTimeout(connectionTimeout);
      redisClient = client;
      isConnecting = false;
      reconnectAttempts = 0;
    });

    client.on('error', (err) => {
      console.error('Redis Client Error:', err);
      if (redisClient === client) {
        redisClient = null;
      }
    });

    client.on('close', () => {
      console.log('Redis connection closed');
      if (redisClient === client) {
        redisClient = null;
      }
    });

    await Promise.race([
      client.ping(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Initial ping timeout')), 5000)
      )
    ]);

    return client;
  } catch (error) {
    isConnecting = false;
    clearTimeout(connectionTimeout);
    console.error('Redis Connection Error:', error);

    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached');
      return null;
    }
    throw error;
  }
}

async function waitForConnection(timeout = 3000) {
  const start = Date.now();
  while (isConnecting && Date.now() - start < timeout) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (!redisClient) {
    throw new Error('Redis connection failed');
  }
  return redisClient;
}

async function getFromCache(key) {
  try {
      const client = await createRedisClient();
      if (!client) return null;

      // Use pipelining for multiple gets
      const pipeline = client.pipeline();
      pipeline.get(key);
      pipeline.get(`stale:${key}`);

      const results = await Promise.race([
          pipeline.exec(),
          new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Get operation timeout')), 2000)
          )
      ]);

      // Return fresh data if available, otherwise stale data
      const [freshData, staleData] = results.map(r => r[1]);
      return freshData ? JSON.parse(freshData) : (staleData ? JSON.parse(staleData) : null);

  } catch (error) {
      console.error('Redis Get Error:', error);
      return null;
  }
}

async function setToCache(key, data, expirySeconds = 300) {
  try {
    const client = await createRedisClient();
    if (!client) return;

    const pipeline = client.pipeline();
    
    pipeline.setex(key, expirySeconds, JSON.stringify(data));
    
    pipeline.setex(`stale:${key}`, 86400, JSON.stringify(data));

    await Promise.race([
      pipeline.exec(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Set operation timeout')), 2000)
      )
    ]);
  } catch (error) {
    console.error('Redis Set Error:', error);
  }
}

async function checkRedisConnection() {
  try {
    const client = await createRedisClient();
    if (!client) return false;
    await client.ping();
    return true;
  } catch (error) {
    console.error('Redis connection check failed:', error);
    return false;
  }
}

process.on('SIGTERM', async () => {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch (error) {
      console.error('Redis shutdown error:', error);
    }
  }
});

module.exports = {
  getFromCache,
  setToCache,
  checkRedisConnection
};