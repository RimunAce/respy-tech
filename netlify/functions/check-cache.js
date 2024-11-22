const { checkRedisConnection } = require('./utils/redis-client');

exports.handler = async function() {
  try {
    const connected = await checkRedisConnection();
    return {
      statusCode: 200,
      body: JSON.stringify({ connected })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ connected: false, error: error.message })
    };
  }
};