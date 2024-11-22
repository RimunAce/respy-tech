const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache = new Map();

const getCachedData = (key) => {
    const cachedItem = cache.get(key);
    if (cachedItem && Date.now() - cachedItem.timestamp < CACHE_DURATION) {
        return cachedItem.data;
    }
    cache.delete(key);
    return null;
};

const setCachedData = (key, data) => {
    cache.set(key, { data, timestamp: Date.now() });
};

const cleanupCache = () => {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
        if (now - value.timestamp >= CACHE_DURATION) {
            cache.delete(key);
        }
    }
};

// Start the cleanup interval
setInterval(cleanupCache, CACHE_DURATION);

export {
    getCachedData,
    setCachedData,
    cleanupCache,
    CACHE_DURATION
};