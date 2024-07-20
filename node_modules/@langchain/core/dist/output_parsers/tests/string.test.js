import { describe } from "@jest/globals";
import { StringOutputParser } from "../string.js";
import { AIMessage, } from "../../messages/index.js";
describe("StringOutputParser", () => {
    test("string input", async () => {
        const msg = "hello";
        const parser = new StringOutputParser();
        const result = await parser.invoke(msg);
        expect(result).toEqual("hello");
    });
    test("BaseMessage string content", async () => {
        const msg = new AIMessage({ content: "hello" });
        const parser = new StringOutputParser();
        const result = await parser.invoke(msg);
        expect(result).toEqual("hello");
    });
    test("BaseMessage complex text type", async () => {
        const parser = new StringOutputParser();
        const content = [
            {
                type: "text",
                text: "hello",
            },
        ];
        const msg = new AIMessage({
            content,
        });
        const result = await parser.invoke(msg);
        expect(result).toEqual("hello");
    });
    test("BaseMessage multiple complex text type", async () => {
        const parser = new StringOutputParser();
        const content = [
            {
                type: "text",
                text: "hello",
            },
            {
                type: "text",
                text: "there",
            },
        ];
        const msg = new AIMessage({
            content,
        });
        const result = await parser.invoke(msg);
        expect(result).toEqual("hellothere");
    });
    test("BaseMessage complex text and image type fails", async () => {
        const parser = new StringOutputParser();
        const content = [
            {
                type: "text",
                text: "hello",
            },
            {
                type: "image_url",
                image_url: "https://example.com/example.png",
            },
        ];
        const msg = new AIMessage({
            content,
        });
        await expect(async () => {
            await parser.invoke(msg);
        }).rejects.toThrowError();
    });
});
