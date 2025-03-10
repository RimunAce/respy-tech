const {
  getFromCache,
  setToCache,
  checkRedisConnection,
} = require("./utils/redis-client");
const dotenv = require("dotenv");

dotenv.config();

const fetchWithTimeout = async (url, fetchOptions, timeout = 5000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        Accept: "application/json",
        "User-Agent": "Respy.Tech/1.0",
        Origin: "https://respy.tech",
        ...fetchOptions?.headers,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    clearTimeout(timeoutId);
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error("Request timed out after 5 seconds");
    }
    throw error;
  }
};

exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin":
      process.env.NODE_ENV === "development"
        ? "http://localhost:8888"
        : "https://respy.tech",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers };
  }

  console.log("API Handler called with path:", event.path);
  const provider = event.path.split("/").pop();
  const cacheKey = `provider:${provider}:models`;

  try {
    // Check Redis connection first
    const isRedisConnected = await checkRedisConnection();
    console.log("Redis connection status:", isRedisConnected);

    if (!isRedisConnected) {
      console.warn("Redis is not connected, proceeding without cache");
    } else {
      // Check Redis cache
      console.log("Checking Redis cache for key:", cacheKey);
      const cachedData = await getFromCache(cacheKey);
      if (cachedData) {
        console.log("Cache hit for provider:", provider);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ data: cachedData, source: "cache" }),
        };
      }
      console.log("Cache miss for provider:", provider);
    }

    // If not in cache, fetch from API
    const apiEndpoints = {
      rimunace: "https://api.rimunace.xyz/v1/models",
      zanity: "https://api.zanity.xyz/v1/models",
      anyai: "https://api.llmplayground.net/v1/models",
      cablyai: "https://cablyai.com/v1/models",
      fresedgpt: "https://fresedgpt.space/v1/models",
      heckerai: "https://heckerai.com/v1/models",
      zukijourney: "https://zukijourney.xyzbot.net/v1/models",
      shadowjourney: "https://shadowjourney.xyz/v1/models",
      shuttleai: "https://api.shuttleai.com/v1/models",
      electronhub: "https://api.electronhub.top/v1/models",
      oxygen: "https://app.oxyapi.uk/v1/models",
      nagaai: "https://api.naga.ac/v1/models",
      skailar: "https://test.skailar.it/v1/models",
      helixmind: "https://helixmind.online/v1/models",
      webraftai: "https://api.webraft.in/v1/models",
      voidai: "https://api.voidai.xyz/v1/models",
      hareproxy: "https://api.hareproxy.com/api/pricing",
    };

    if (!apiEndpoints[provider]) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid provider" }),
      };
    }

    const proxyHost = process.env.proxy_host;
    const proxyPort = process.env.proxy_port;
    const proxyAuth = process.env.proxy_auth;

    const fetchOptions = {};
    if (proxyHost && proxyPort) {
      fetchOptions.agent = new (
        await import("https-proxy-agent")
      ).HttpsProxyAgent({
        host: proxyHost,
        port: proxyPort,
        auth: proxyAuth,
        protocol: "http:",
      });
    }

    const data = await fetchWithTimeout(apiEndpoints[provider], fetchOptions);

    // Validate data structure before caching
    if (
      (provider === "rimunace" && Array.isArray(data?.data)) ||
      (provider !== "rimunace" && Array.isArray(data?.data)) ||
      (provider === "hareproxy" && Array.isArray(data?.data))
    ) {
      // For hareproxy, we need to transform the data to match the expected format
      let processedData = data.data;

      if (provider === "hareproxy") {
        // Transform hareproxy data to match the expected format
        processedData = data.data.map((model) => ({
          id: model.model_name,
          object: "model",
          created: Date.now(),
          owned_by: model.owner_by || "hareproxy",
        }));
      }

      // Cache valid data with provider-specific TTL
      const ttl = provider === "rimunace" ? 600 : 300; // 10 mins for rimunace, 5 mins for others
      await setToCache(
        cacheKey,
        provider === "hareproxy" ? processedData : data.data,
        ttl
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          data: provider === "hareproxy" ? processedData : data.data,
          source: "api",
        }),
      };
    } else {
      throw new Error("Invalid data structure received from provider");
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
          source: "stale_cache",
          warning: "Using stale data due to provider error",
        }),
      };
    }

    return {
      statusCode: error.message.includes("timed out") ? 504 : 500,
      headers,
      body: JSON.stringify({
        error: error.message,
        provider,
      }),
    };
  }
};
