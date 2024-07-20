const { OpenAIEmbeddings } = require('@langchain/openai');
const { FaissStore } = require('@langchain/community/vectorstores/faiss');

let vectorStore = null;

async function initializeVectorStore() {
  if (!vectorStore) {
    const embeddings = new OpenAIEmbeddings({
      apiKey: process.env.openAiKey,
      model: 'text-embedding-ada-002'
    });
    try {
      vectorStore = await FaissStore.load('/tmp/vector-store', embeddings);
    } catch (error) {
      console.error('Failed to load vector store:', error);
      vectorStore = await FaissStore.fromTexts(['Fallback document'], [], embeddings);
    }
  }
}

exports.handler = async (event) => {
  try {
    const { action, data } = JSON.parse(event.body);
    await initializeVectorStore();

    let result;
    switch (action) {
      case 'add':
        await vectorStore.addDocuments([{ pageContent: data.content, metadata: data.metadata }]);
        result = { message: 'Document added successfully' };
        break;
      case 'search':
        result = await vectorStore.similaritySearch(data.query, data.k || 5);
        break;
      default:
        throw new Error('Invalid action');
    }

    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (error) {
    console.error('Error in vectorStore function:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};