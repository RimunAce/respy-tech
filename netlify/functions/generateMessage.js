const axios = require('axios');
const { OpenAIEmbeddings } = require('@langchain/openai');
const { FaissStore } = require('@langchain/community/vectorstores/faiss');
const { Document } = require('langchain/document');

const apiEndpoint = process.env.apiEndpoint || 'https://fresedgpt.space/v1/chat/completions';
const apiKey = process.env.apiKey;
const openAiKey = process.env.openAiKey;

let vectorStore = null;

async function initializeVectorStore() {
  if (!vectorStore) {
    const embeddings = new OpenAIEmbeddings({ apiKey: openAiKey, model: 'text-embedding-ada-002' });
    try {
      vectorStore = await FaissStore.load('/tmp/vector-store', embeddings);
    } catch (error) {
      console.error('Failed to load vector store:', error);
      vectorStore = await FaissStore.fromTexts(['Fallback document'], [], embeddings);
    }
  }
}

async function processRequest(event) {
  const { userMessage, currentConversation, uploadedFiles, model } = JSON.parse(event.body);

  await initializeVectorStore();

  let messageContent = userMessage;
  if (uploadedFiles?.length) {
    await Promise.all(uploadedFiles.map(file => 
      vectorStore.addDocuments([new Document({ pageContent: file.content, metadata: { filename: file.name } })])
    ));
    const relevantContext = await vectorStore.similaritySearch(userMessage, 5);
    messageContent += "\n\nAttached files:\n" + uploadedFiles.map(file => `- ${file.name}`).join('\n');
    if (relevantContext.length) {
      messageContent += "\n\nRelevant information:\n" + 
        relevantContext.map((doc, index) => `${index + 1}. ${doc.pageContent}`).join('\n');
    }
  }

  const messages = [...currentConversation.messages, { role: 'user', content: messageContent }];
  const response = await axios.post(apiEndpoint, {
    model: model || "gpt-4o",
    messages,
    temperature: 0.7,
  }, {
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    timeout: 50000
  });

  return { aiResponse: response.data.choices[0].message.content };
}

exports.handler = async (event) => {
  try {
    const result = await Promise.race([
      processRequest(event),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Function timed out')), 9000))
    ]);
    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (error) {
    console.error('Error in generateMessage:', error);
    return {
      statusCode: error.message === 'Function timed out' ? 202 : (error.response?.status || 500),
      body: JSON.stringify({
        error: "Failed to generate response",
        details: error.message,
        retryAfter: error.message === 'Function timed out' ? 5 : undefined
      })
    };
  }
};