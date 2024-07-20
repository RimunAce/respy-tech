/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable arrow-body-style */
import OpenAI from "openai";
import wiki from "wikipedia";
import { Client, RunTree } from "langsmith";
import { runOnDataset } from "../runner_utils.js";
const oaiClient = new OpenAI();
test(`Chat model dataset`, async () => {
    async function generateWikiSearch(question, parentRun) {
        const messages = [
            {
                role: "system",
                content: "Generate a search query to pass into wikipedia to answer the user's question. Return only the search query and nothing more. This will be passed in directly to the Wikipedia search engine.",
            },
            { role: "user", content: question },
        ];
        const childRun = await parentRun.createChild({
            name: "Generate Wiki Search",
            run_type: "llm",
            inputs: {
                messages,
            },
        });
        try {
            const chatCompletion = await oaiClient.chat.completions.create({
                model: "gpt-3.5-turbo",
                // @ts-expect-error Typing is wrong
                messages,
                temperature: 0,
            });
            childRun.end(chatCompletion);
            await childRun.postRun();
            return chatCompletion.choices[0].message.content ?? "";
        }
        catch (error) {
            console.error("Error generating wiki search query:", error);
            childRun.end({ error: error.toString() });
            await childRun.postRun();
            throw error;
        }
    }
    function convertDocs(results) {
        return results.map((r) => ({
            page_content: r.summary,
            type: "Document",
            metadata: { url: r.url },
        }));
    }
    async function retrieve(query, parentRun) {
        const childRun = await parentRun.createChild({
            name: "Wikipedia Retriever",
            run_type: "retriever",
            inputs: { query },
        });
        try {
            const { results } = await wiki.default.search(query, { limit: 10 });
            const finalResults = [];
            for (const result of results) {
                if (finalResults.length >= 2) {
                    // Just return the top 2 pages for now
                    break;
                }
                const page = await wiki.default.page(result.title, {
                    autoSuggest: false,
                });
                const summary = await page.summary();
                finalResults.push({
                    summary: summary.extract,
                    url: page.fullurl,
                });
            }
            childRun.end({
                documents: convertDocs(finalResults),
            });
            await childRun.postRun();
            return finalResults;
        }
        catch (error) {
            console.error("Error in retrieval:", error);
            childRun.end({ error: error.toString() });
            await childRun.postRun();
            throw error;
        }
    }
    async function generateAnswer(question, context, parentRun) {
        const messages = [
            {
                role: "system",
                content: `Answer the user's question based only on the content below:\n\n${context}`,
            },
            { role: "user", content: question },
        ];
        const childRun = await parentRun.createChild({
            name: "Generate Answer",
            run_type: "llm",
            inputs: {
                messages,
            },
        });
        try {
            const chatCompletion = await oaiClient.chat.completions.create({
                model: "gpt-3.5-turbo",
                // @ts-expect-error Typing is wrong
                messages,
                temperature: 0,
            });
            childRun.end(chatCompletion);
            await childRun.postRun();
            return chatCompletion.choices[0].message.content ?? "";
        }
        catch (error) {
            console.error("Error generating answer:", error);
            childRun.end({ error: error.toString() });
            await childRun.postRun();
            throw error;
        }
    }
    async function ragPipeline(question) {
        const parentRunConfig = {
            name: "Wikipedia RAG Pipeline",
            run_type: "chain",
            inputs: { question },
        };
        const parentRun = new RunTree(parentRunConfig);
        try {
            const query = await generateWikiSearch(question, parentRun);
            const retrieverResults = await retrieve(query, parentRun);
            const context = retrieverResults
                .map((result) => result.summary)
                .join("\n\n");
            const answer = await generateAnswer(question, context, parentRun);
            await parentRun.end({
                outputs: answer,
            });
            await parentRun.postRun();
            return answer;
        }
        catch (error) {
            console.error("Error running RAG Pipeline:", error);
            parentRun.end({ error: error.toString() });
            await parentRun.postRun();
            throw error;
        }
    }
    const examples = [
        [
            "When was the Apple Vision Pro released in the US?",
            "The Apple Vision Pro was released in the United States on February 2, 2024.",
        ],
        [
            "What is LangChain?",
            "LangChain is an open-source framework for building applications using large language models.",
        ],
        [
            "Who is the chairman of OpenAI?",
            "Bret Taylor is the chairman of the OpenAI",
        ],
    ];
    const lsClient = new Client();
    const datasetName = "JS run on dataset integration test";
    let dataset;
    try {
        dataset = await lsClient.readDataset({ datasetName });
    }
    catch (e) {
        dataset = await lsClient.createDataset(datasetName);
        await Promise.all(examples.map(async ([question, answer]) => {
            await lsClient.createExample({ question }, { answer }, { datasetId: dataset.id });
        }));
    }
    // An illustrative custom evaluator example
    const unsure = async ({ prediction }) => {
        if (typeof prediction?.output !== "string") {
            throw new Error("Invalid prediction format for this evaluator. Please check your chain's outputs and try again.");
        }
        return {
            key: "unsure",
            score: prediction.output.includes("not sure"),
        };
    };
    const evaluation = {
        // The 'evaluators' are loaded from LangChain's evaluation
        // library.
        evaluators: [
            {
                evaluatorType: "labeled_criteria",
                criteria: "correctness",
                feedbackKey: "correctness",
                formatEvaluatorInputs: ({ rawInput, rawPrediction, rawReferenceOutput, }) => {
                    return {
                        input: rawInput.question,
                        prediction: rawPrediction.output,
                        reference: rawReferenceOutput.answer,
                    };
                },
            },
        ],
        // Custom evaluators can be user-defined RunEvaluator's
        // or a compatible function
        customEvaluators: [unsure],
    };
    const wrappedRagPipeline = async ({ question, }) => {
        return ragPipeline(question);
    };
    console.log(await runOnDataset(wrappedRagPipeline, datasetName, {
        evaluationConfig: evaluation,
    }));
});
test("Thrown errors should not interrupt dataset run", async () => {
    async function ragPipeline(_) {
        throw new Error("I don't know, I am learning from aliens.");
    }
    const examples = [
        [
            "When was the Apple Vision Pro released in the US?",
            "The Apple Vision Pro was released in the United States on February 2, 2024.",
        ],
        [
            "What is LangChain?",
            "LangChain is an open-source framework for building applications using large language models.",
        ],
        [
            "Who is the chairman of OpenAI?",
            "Bret Taylor is the chairman of the OpenAI",
        ],
    ];
    const lsClient = new Client();
    const datasetName = "JS run on dataset integration test";
    let dataset;
    try {
        dataset = await lsClient.readDataset({ datasetName });
    }
    catch (e) {
        dataset = await lsClient.createDataset(datasetName);
        await Promise.all(examples.map(async ([question, answer]) => {
            await lsClient.createExample({ question }, { answer }, { datasetId: dataset.id });
        }));
    }
    // An illustrative custom evaluator example
    const dummy = async (_) => {
        console.log("RUNNING EVAL");
        throw new Error("Expected error");
    };
    const evaluation = {
        // Custom evaluators can be user-defined RunEvaluator's
        // or a compatible function
        customEvaluators: [dummy],
    };
    const wrappedRagPipeline = async ({ question, }) => {
        return ragPipeline(question);
    };
    console.log(await runOnDataset(wrappedRagPipeline, datasetName, {
        evaluationConfig: evaluation,
        maxConcurrency: 1,
    }));
});
