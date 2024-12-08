const { getCacheStatus } = require('./utils/redis-client');

exports.handler = async function() {
  try {
    const status = await getCacheStatus();
    return {
      statusCode: 200,
      body: JSON.stringify(status)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        connected: false, 
        error: error.message 
      })
    };
  }
};