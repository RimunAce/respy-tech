const axios = require('axios');
const { OpenAIEmbeddings } = require('@langchain/openai');
const { FaissStore } = require('@langchain/community/vectorstores/faiss');
const { Document } = require('langchain/document');
const NodeCache = require('node-cache');

const apiEndpoint = process.env.apiEndpoint || 'https://fresedgpt.space/v1/chat/completions';
const apiKey = process.env.apiKey;

axios.defaults.timeout = 50000;

const embeddings = new OpenAIEmbeddings({
    apiKey: process.env.openAiKey, 
    model: 'text-embedding-ada-002',
});

let vectorStore = null;
const cache = new NodeCache({ stdTTL: 600 }); // Cache for 10 minutes

async function initializeVectorStore() {
    if (!vectorStore) {
        try {
            vectorStore = await FaissStore.load('/data/vector-store', embeddings);
        } catch (error) {
            console.error('Failed to load vector store:', error);
            const sampleTexts = ['This is document 1', 'This is document 2'];
            vectorStore = await FaissStore.fromTexts(sampleTexts, [], embeddings);
        }
    }
}

async function addDocumentToVectorStore(text, metadata) {
    const doc = new Document({ pageContent: text, metadata });
    await vectorStore.addDocuments([doc]);
}

async function searchVectorStore(query, k = 5) {
    const cacheKey = `search_${query}_${k}`;
    const cachedResult = cache.get(cacheKey);
    if (cachedResult) return cachedResult;

    const results = await vectorStore.similaritySearch(query, k);
    const pageContents = results.map(result => result.pageContent);
    cache.set(cacheKey, pageContents);
    return pageContents;
}

exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    try {
        const result = await Promise.race([
            processRequest(event),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Function timed out')), 9000)) // Set timeout to 9 seconds
        ]);

        return {
            statusCode: 200,
            body: JSON.stringify(result)
        };
    } catch (error) {
        console.error('Error in generateMessage:', error);
        
        // If it's a timeout error, return a specific response
        if (error.message === 'Function timed out') {
            return {
                statusCode: 202, // Accepted
                body: JSON.stringify({
                    message: "The request is taking longer than expected. Please try again.",
                    retryAfter: 5 // Suggest retry after 5 seconds
                })
            };
        }

        return {
            statusCode: error.response?.status || 500,
            body: JSON.stringify({
                error: "Failed to generate response",
                details: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            })
        };
    }
};

async function processRequest(event) {
    const { userMessage, currentConversation, uploadedFiles, model } = JSON.parse(event.body);

    await initializeVectorStore();

    let messageContent = userMessage;
    let relevantContext = [];

    if (uploadedFiles && uploadedFiles.length > 0) {
        await Promise.all(uploadedFiles.map(file => addDocumentToVectorStore(file.content, { filename: file.name })));
        relevantContext = await searchVectorStore(userMessage);

        messageContent += "\n\nAttached files:\n" + uploadedFiles.map(file => `- ${file.name}`).join('\n');

        if (relevantContext.length > 0) {
            messageContent += "\n\nRelevant information from uploaded files:\n" + 
                relevantContext.map((context, index) => `${index + 1}. ${context}`).join('\n');
        }
    }

    if (!apiKey) {
        throw new Error('API key is missing');
    }

    const aiResponse = await makeRequest(model || "gpt-4o", messageContent, currentConversation.messages);
    return { aiResponse };
}

async function makeRequest(requestModel, messageContent, conversationMessages) {
    const cacheKey = `request_${requestModel}_${messageContent}`;
    const cachedResponse = cache.get(cacheKey);
    if (cachedResponse) return cachedResponse;

    const messages = [
        ...conversationMessages,
        { role: 'user', content: messageContent }
    ];

    const requestBody = {
        model: requestModel,
        messages: messages,
        temperature: 0.7,
    };

    try {
        const response = await axios.post(apiEndpoint, requestBody, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            }
        });

        if (response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
            const content = response.data.choices[0].message.content;
            cache.set(cacheKey, content);
            return content;
        } else {
            throw new Error('Unexpected API response format');
        }
    } catch (error) {
        console.error(`Error with model ${requestModel}:`, error.message);
        throw error;
    }
}

async function readFile(file) {
  return new Promise(async (resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const content = e.target.result;
        let processedContent = content; 

        if (file.type === 'application/pdf') {
          // Extract text from PDF, potentially in chunks
          processedContent = await extractTextFromPDF(content);
        } 

        resolve(processedContent);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        reject(new Error(`Error processing file ${file.name}`));
      }
    };

    reader.onerror = (error) => {
      console.error(`Error reading file ${file.name}:`, error);
      reject(new Error(`Error reading file ${file.name}`)); 
    };

    reader.readAsArrayBuffer(file);
  });
}
