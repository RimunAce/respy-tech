// netlify/functions/keepWarm.js
const https = require('https');

exports.handler = async function(event, context) {
  const functions = ['generateChatTitle', 'zenithProxy', 'chatProxy', 'multiLLM'];
  
  for (const func of functions) {
    await new Promise((resolve, reject) => {
      const req = https.get(`https://respy.tech/.netlify/functions/${func}`, (res) => {
        res.on('data', () => {});
        res.on('end', resolve);
      });
      req.on('error', reject);
      req.end();
    });
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Warm-up complete' }),
  };
};