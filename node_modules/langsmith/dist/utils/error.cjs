"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printErrorStackTrace = void 0;
function getErrorStackTrace(e) {
    if (typeof e !== "object" || e == null)
        return undefined;
    if (!("stack" in e) || typeof e.stack !== "string")
        return undefined;
    let stack = e.stack;
    const prevLine = `${e}`;
    if (stack.startsWith(prevLine)) {
        stack = stack.slice(prevLine.length);
    }
    if (stack.startsWith("\n")) {
        stack = stack.slice(1);
    }
    return stack;
}
function printErrorStackTrace(e) {
    const stack = getErrorStackTrace(e);
    if (stack == null)
        return;
    console.error(stack);
}
exports.printErrorStackTrace = printErrorStackTrace;
