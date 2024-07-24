// netlify/functions/keepWarm.js
const https = require('https');

exports.handler = async function(event, context) {
  const functions = ['sendMessage', 'generateChatTitle', 'generateTitle', 'generateMessage', 'zenithResponse'];
  
  for (const func of functions) {
    await new Promise((resolve, reject) => {
      const req = https.get(`${process.env.URL}/.netlify/functions/${func}`, (res) => {
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