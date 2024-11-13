exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' 
      ? 'http://localhost:8888' 
      : 'https://respy.tech',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse the incoming request body
    let data;
    if (event.isBase64Encoded) {
      const buffer = Buffer.from(event.body, 'base64');
      data = JSON.parse(buffer.toString());
    } else {
      // Handle URL-encoded form data
      const formData = new URLSearchParams(event.body);
      data = Object.fromEntries(formData);
    }

    // Validate required fields
    const requiredFields = ['form-name', 'providerName', 'apiEndpoint', 'providerIcon'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required fields', 
          fields: missingFields 
        })
      };
    }

    // Validate URLs
    const urlFields = ['apiEndpoint', 'websiteUrl', 'discordServer', 'githubUrl', 'providerIcon'];
    const invalidUrls = urlFields
      .filter(field => data[field])
      .filter(field => {
        try {
          new URL(data[field]);
          return false;
        } catch {
          return true;
        }
      });

    if (invalidUrls.length > 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid URLs provided', 
          fields: invalidUrls 
        })
      };
    }

    // Log the submission
    console.log('Form submission received:', {
      formName: data['form-name'],
      data
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Form submitted successfully',
        data: {
          formName: data['form-name'],
          providerName: data.providerName
        }
      })
    };
  } catch (error) {
    console.error('Form submission error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};
