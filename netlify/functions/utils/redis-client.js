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
    const delay = Math.min(times * 1000, 3000);
    console.log(`Redis retry attempt ${times}, delay: ${delay}ms`);
    if (times > 3) {
      console.error('Redis retry limit reached');
      return null;
    }
    return delay;
  },
  reconnectOnError(err) {
    console.error('Redis reconnection error:', err.message);
    return true; // Try to reconnect on all errors
  }
};

async function createRedisClient() {
  if (redisClient?.status === 'ready') {
    console.log('Using existing Redis connection');
    return redisClient;
  }
  
  if (isConnecting) {
    console.log('Connection in progress, waiting...');
    return waitForConnection();
  }

  isConnecting = true;
  clearTimeout(connectionTimeout);
  reconnectAttempts++;

  try {
    console.log('Creating new Redis client...', { uri: process.env.REDIS_URI ? 'URI present' : 'URI missing' });
    
    if (!process.env.REDIS_URI) {
      throw new Error('REDIS_URI environment variable is not set');
    }

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
      console.error('Redis Client Error:', err.message, err.stack);
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

    // Test connection with timeout
    await Promise.race([
      client.ping().then(() => {
        console.log('Initial Redis ping successful');
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Initial Redis ping timeout after 5000ms')), 5000)
      )
    ]);

    return client;
  } catch (error) {
    isConnecting = false;
    clearTimeout(connectionTimeout);
    console.error('Redis Connection Error:', error.message, error.stack);

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

    const pipeline = client.pipeline();
    pipeline.get(key);
    pipeline.get(`stale:${key}`);
    pipeline.ttl(key);

    const results = await Promise.race([
      pipeline.exec(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Get operation timeout')), 2000)
      )
    ]);

    const [freshData, staleData, ttl] = results.map(r => r[1]);

    if (freshData) {
      return JSON.parse(freshData);
    }

    if (staleData && ttl <= 0) {
      client.del(`stale:${key}`).catch(console.error);
      return null;
    }

    return staleData ? JSON.parse(staleData) : null;
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
    const staleExpiry = Math.min(expirySeconds * 2, 3600); // Max 1 hour stale data

    pipeline.setex(key, expirySeconds, JSON.stringify(data));
    pipeline.setex(`stale:${key}`, staleExpiry, JSON.stringify(data));

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

async function getCacheStatus() {
  try {
    const client = await createRedisClient();
    if (!client) return { connected: false };

    const pipeline = client.pipeline();
    pipeline.ping();
    pipeline.info();
    pipeline.dbsize();
    
    const results = await Promise.race([
      pipeline.exec(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Status check timeout')), 2000)
      )
    ]);

    const [ping, info, dbsize] = results.map(r => r[1]);
    
    // Parse Redis INFO command output
    const infoObj = info.split('\r\n').reduce((acc, line) => {
      const [key, value] = line.split(':');
      if (key) acc[key.trim()] = value?.trim();
      return acc;
    }, {});

    return {
      connected: ping === 'PONG',
      uptime: parseInt(infoObj.uptime_in_seconds) || 0,
      lastSave: infoObj.rdb_last_save_time ? new Date(parseInt(infoObj.rdb_last_save_time) * 1000) : null,
      keysCount: parseInt(dbsize) || 0,
      version: infoObj.redis_version,
      memory: infoObj.used_memory_human
    };
  } catch (error) {
    console.error('Cache status check failed:', error);
    return { connected: false };
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
  checkRedisConnection,
  getCacheStatus
};