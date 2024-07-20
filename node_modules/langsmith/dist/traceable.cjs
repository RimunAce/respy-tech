"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROOT = exports.withRunTree = exports.isTraceableFunction = exports.getCurrentRunTree = exports.traceable = void 0;
const node_async_hooks_1 = require("node:async_hooks");
const run_trees_js_1 = require("./run_trees.cjs");
const env_js_1 = require("./env.cjs");
const traceable_js_1 = require("./singletons/traceable.cjs");
const asserts_js_1 = require("./utils/asserts.cjs");
traceable_js_1.AsyncLocalStorageProviderSingleton.initializeGlobalInstance(new node_async_hooks_1.AsyncLocalStorage());
const handleRunInputs = (rawInputs) => {
    const firstInput = rawInputs[0];
    if (firstInput == null) {
        return {};
    }
    if (rawInputs.length > 1) {
        return { args: rawInputs };
    }
    if ((0, asserts_js_1.isKVMap)(firstInput)) {
        return firstInput;
    }
    return { input: firstInput };
};
const handleRunOutputs = (rawOutputs) => {
    if ((0, asserts_js_1.isKVMap)(rawOutputs)) {
        return rawOutputs;
    }
    return { outputs: rawOutputs };
};
const getTracingRunTree = (runTree, inputs, getInvocationParams) => {
    if (!(0, env_js_1.isTracingEnabled)(runTree.tracingEnabled)) {
        return undefined;
    }
    runTree.inputs = handleRunInputs(inputs);
    const invocationParams = getInvocationParams?.(...inputs);
    if (invocationParams != null) {
        runTree.extra ??= {};
        runTree.extra.metadata = {
            ...invocationParams,
            ...runTree.extra.metadata,
        };
    }
    return runTree;
};
// idea: store the state of the promise outside
// but only when the promise is "consumed"
const getSerializablePromise = (arg) => {
    const proxyState = { current: undefined };
    const promiseProxy = new Proxy(arg, {
        get(target, prop, receiver) {
            if (prop === "then") {
                const boundThen = arg[prop].bind(arg);
                return (resolve, reject = (x) => {
                    throw x;
                }) => {
                    return boundThen((value) => {
                        proxyState.current = ["resolve", value];
                        return resolve(value);
                    }, (error) => {
                        proxyState.current = ["reject", error];
                        return reject(error);
                    });
                };
            }
            if (prop === "catch") {
                const boundCatch = arg[prop].bind(arg);
                return (reject) => {
                    return boundCatch((error) => {
                        proxyState.current = ["reject", error];
                        return reject(error);
                    });
                };
            }
            if (prop === "toJSON") {
                return () => {
                    if (!proxyState.current)
                        return undefined;
                    const [type, value] = proxyState.current ?? [];
                    if (type === "resolve")
                        return value;
                    return { error: value };
                };
            }
            return Reflect.get(target, prop, receiver);
        },
    });
    return promiseProxy;
};
const convertSerializableArg = (arg) => {
    if ((0, asserts_js_1.isReadableStream)(arg)) {
        const proxyState = [];
        const transform = new TransformStream({
            start: () => void 0,
            transform: (chunk, controller) => {
                proxyState.push(chunk);
                controller.enqueue(chunk);
            },
            flush: () => void 0,
        });
        const pipeThrough = arg.pipeThrough(transform);
        Object.assign(pipeThrough, { toJSON: () => proxyState });
        return pipeThrough;
    }
    if ((0, asserts_js_1.isAsyncIterable)(arg)) {
        const proxyState = { current: [] };
        return new Proxy(arg, {
            get(target, prop, receiver) {
                if (prop === Symbol.asyncIterator) {
                    return () => {
                        const boundIterator = arg[Symbol.asyncIterator].bind(arg);
                        const iterator = boundIterator();
                        return new Proxy(iterator, {
                            get(target, prop, receiver) {
                                if (prop === "next" || prop === "return" || prop === "throw") {
                                    const bound = iterator.next.bind(iterator);
                                    return (...args) => {
                                        // @ts-expect-error TS cannot infer the argument types for the bound function
                                        const wrapped = getSerializablePromise(bound(...args));
                                        proxyState.current.push(wrapped);
                                        return wrapped;
                                    };
                                }
                                if (prop === "return" || prop === "throw") {
                                    return iterator.next.bind(iterator);
                                }
                                return Reflect.get(target, prop, receiver);
                            },
                        });
                    };
                }
                if (prop === "toJSON") {
                    return () => {
                        const onlyNexts = proxyState.current;
                        const serialized = onlyNexts.map((next) => next.toJSON());
                        const chunks = serialized.reduce((memo, next) => {
                            if (next?.value)
                                memo.push(next.value);
                            return memo;
                        }, []);
                        return chunks;
                    };
                }
                return Reflect.get(target, prop, receiver);
            },
        });
    }
    if (!Array.isArray(arg) && (0, asserts_js_1.isIteratorLike)(arg)) {
        const proxyState = [];
        return new Proxy(arg, {
            get(target, prop, receiver) {
                if (prop === "next" || prop === "return" || prop === "throw") {
                    const bound = arg[prop]?.bind(arg);
                    return (...args) => {
                        // @ts-expect-error TS cannot infer the argument types for the bound function
                        const next = bound?.(...args);
                        if (next != null)
                            proxyState.push(next);
                        return next;
                    };
                }
                if (prop === "toJSON") {
                    return () => {
                        const chunks = proxyState.reduce((memo, next) => {
                            if (next.value)
                                memo.push(next.value);
                            return memo;
                        }, []);
                        return chunks;
                    };
                }
                return Reflect.get(target, prop, receiver);
            },
        });
    }
    if ((0, asserts_js_1.isThenable)(arg)) {
        return getSerializablePromise(arg);
    }
    return arg;
};
/**
 * Higher-order function that takes function as input and returns a
 * "TraceableFunction" - a wrapped version of the input that
 * automatically handles tracing. If the returned traceable function calls any
 * traceable functions, those are automatically traced as well.
 *
 * The returned TraceableFunction can accept a run tree or run tree config as
 * its first argument. If omitted, it will default to the caller's run tree,
 * or will be treated as a root run.
 *
 * @param wrappedFunc Targeted function to be traced
 * @param config Additional metadata such as name, tags or providing
 *     a custom LangSmith client instance
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function traceable(wrappedFunc, config) {
    const { aggregator, argsConfigPath, ...runTreeConfig } = config ?? {};
    const traceableFunc = (...args) => {
        let ensuredConfig;
        try {
            let runtimeConfig;
            if (argsConfigPath) {
                const [index, path] = argsConfigPath;
                if (index === args.length - 1 && !path) {
                    runtimeConfig = args.pop();
                }
                else if (index <= args.length &&
                    typeof args[index] === "object" &&
                    args[index] !== null) {
                    if (path) {
                        const { [path]: extracted, ...rest } = args[index];
                        runtimeConfig = extracted;
                        args[index] = rest;
                    }
                    else {
                        runtimeConfig = args[index];
                        args.splice(index, 1);
                    }
                }
            }
            ensuredConfig = {
                name: wrappedFunc.name || "<lambda>",
                ...runTreeConfig,
                ...runtimeConfig,
                tags: [
                    ...new Set([
                        ...(runTreeConfig?.tags ?? []),
                        ...(runtimeConfig?.tags ?? []),
                    ]),
                ],
                metadata: {
                    ...runTreeConfig?.metadata,
                    ...runtimeConfig?.metadata,
                },
            };
        }
        catch (err) {
            console.warn(`Failed to extract runtime config from args for ${runTreeConfig?.name ?? wrappedFunc.name}`, err);
            ensuredConfig = {
                name: wrappedFunc.name || "<lambda>",
                ...runTreeConfig,
            };
        }
        const asyncLocalStorage = traceable_js_1.AsyncLocalStorageProviderSingleton.getInstance();
        // TODO: deal with possible nested promises and async iterables
        const processedArgs = args;
        for (let i = 0; i < processedArgs.length; i++) {
            processedArgs[i] = convertSerializableArg(processedArgs[i]);
        }
        const [currentRunTree, rawInputs] = (() => {
            const [firstArg, ...restArgs] = processedArgs;
            // used for handoff between LangChain.JS and traceable functions
            if ((0, run_trees_js_1.isRunnableConfigLike)(firstArg)) {
                return [
                    getTracingRunTree(run_trees_js_1.RunTree.fromRunnableConfig(firstArg, ensuredConfig), restArgs, config?.getInvocationParams),
                    restArgs,
                ];
            }
            // deprecated: legacy CallbackManagerRunTree used in runOnDataset
            // override ALS and do not pass-through the run tree
            if ((0, run_trees_js_1.isRunTree)(firstArg) &&
                "callbackManager" in firstArg &&
                firstArg.callbackManager != null) {
                return [firstArg, restArgs];
            }
            // when ALS is unreliable, users can manually
            // pass in the run tree
            if (firstArg === traceable_js_1.ROOT || (0, run_trees_js_1.isRunTree)(firstArg)) {
                const currentRunTree = getTracingRunTree(firstArg === traceable_js_1.ROOT
                    ? new run_trees_js_1.RunTree(ensuredConfig)
                    : firstArg.createChild(ensuredConfig), restArgs, config?.getInvocationParams);
                return [currentRunTree, [currentRunTree, ...restArgs]];
            }
            // Node.JS uses AsyncLocalStorage (ALS) and AsyncResource
            // to allow storing context
            const prevRunFromStore = asyncLocalStorage.getStore();
            if (prevRunFromStore) {
                return [
                    getTracingRunTree(prevRunFromStore.createChild(ensuredConfig), processedArgs, config?.getInvocationParams),
                    processedArgs,
                ];
            }
            const currentRunTree = getTracingRunTree(new run_trees_js_1.RunTree(ensuredConfig), processedArgs, config?.getInvocationParams);
            return [currentRunTree, processedArgs];
        })();
        return asyncLocalStorage.run(currentRunTree, () => {
            const postRunPromise = currentRunTree?.postRun();
            async function handleChunks(chunks) {
                if (aggregator !== undefined) {
                    try {
                        return await aggregator(chunks);
                    }
                    catch (e) {
                        console.error(`[ERROR]: LangSmith aggregation failed: `, e);
                    }
                }
                return chunks;
            }
            async function* wrapAsyncIteratorForTracing(iterator, snapshot) {
                let finished = false;
                const chunks = [];
                try {
                    while (true) {
                        const { value, done } = await (snapshot
                            ? snapshot(() => iterator.next())
                            : iterator.next());
                        if (done) {
                            finished = true;
                            break;
                        }
                        chunks.push(value);
                        yield value;
                    }
                }
                catch (e) {
                    await currentRunTree?.end(undefined, String(e));
                    throw e;
                }
                finally {
                    if (!finished)
                        await currentRunTree?.end(undefined, "Cancelled");
                    await currentRunTree?.end(handleRunOutputs(await handleChunks(chunks)));
                    await handleEnd();
                }
            }
            function wrapAsyncGeneratorForTracing(iterable, snapshot) {
                const iterator = iterable[Symbol.asyncIterator]();
                const wrappedIterator = wrapAsyncIteratorForTracing(iterator, snapshot);
                iterable[Symbol.asyncIterator] = () => wrappedIterator;
                return iterable;
            }
            async function handleEnd() {
                const onEnd = config?.on_end;
                if (onEnd) {
                    if (!currentRunTree) {
                        console.warn("Can not call 'on_end' if currentRunTree is undefined");
                    }
                    else {
                        onEnd(currentRunTree);
                    }
                }
                await postRunPromise;
                await currentRunTree?.patchRun();
            }
            function gatherAll(iterator) {
                const chunks = [];
                // eslint-disable-next-line no-constant-condition
                while (true) {
                    const next = iterator.next();
                    chunks.push(next);
                    if (next.done)
                        break;
                }
                return chunks;
            }
            let returnValue;
            try {
                returnValue = wrappedFunc(...rawInputs);
            }
            catch (err) {
                returnValue = Promise.reject(err);
            }
            if ((0, asserts_js_1.isAsyncIterable)(returnValue)) {
                const snapshot = node_async_hooks_1.AsyncLocalStorage.snapshot();
                return wrapAsyncGeneratorForTracing(returnValue, snapshot);
            }
            const tracedPromise = new Promise((resolve, reject) => {
                Promise.resolve(returnValue)
                    .then(async (rawOutput) => {
                    if ((0, asserts_js_1.isAsyncIterable)(rawOutput)) {
                        const snapshot = node_async_hooks_1.AsyncLocalStorage.snapshot();
                        return resolve(wrapAsyncGeneratorForTracing(rawOutput, snapshot));
                    }
                    if ((0, asserts_js_1.isGenerator)(wrappedFunc) && (0, asserts_js_1.isIteratorLike)(rawOutput)) {
                        const chunks = gatherAll(rawOutput);
                        await currentRunTree?.end(handleRunOutputs(await handleChunks(chunks.reduce((memo, { value, done }) => {
                            if (!done || typeof value !== "undefined") {
                                memo.push(value);
                            }
                            return memo;
                        }, []))));
                        await handleEnd();
                        return (function* () {
                            for (const ret of chunks) {
                                if (ret.done)
                                    return ret.value;
                                yield ret.value;
                            }
                        })();
                    }
                    try {
                        await currentRunTree?.end(handleRunOutputs(rawOutput));
                        await handleEnd();
                    }
                    finally {
                        // eslint-disable-next-line no-unsafe-finally
                        return rawOutput;
                    }
                }, async (error) => {
                    await currentRunTree?.end(undefined, String(error));
                    await handleEnd();
                    throw error;
                })
                    .then(resolve, reject);
            });
            if (typeof returnValue !== "object" || returnValue === null) {
                return tracedPromise;
            }
            return new Proxy(returnValue, {
                get(target, prop, receiver) {
                    if ((0, asserts_js_1.isPromiseMethod)(prop)) {
                        return tracedPromise[prop].bind(tracedPromise);
                    }
                    return Reflect.get(target, prop, receiver);
                },
            });
        });
    };
    Object.defineProperty(traceableFunc, "langsmith:traceable", {
        value: runTreeConfig,
    });
    return traceableFunc;
}
exports.traceable = traceable;
var traceable_js_2 = require("./singletons/traceable.cjs");
Object.defineProperty(exports, "getCurrentRunTree", { enumerable: true, get: function () { return traceable_js_2.getCurrentRunTree; } });
Object.defineProperty(exports, "isTraceableFunction", { enumerable: true, get: function () { return traceable_js_2.isTraceableFunction; } });
Object.defineProperty(exports, "withRunTree", { enumerable: true, get: function () { return traceable_js_2.withRunTree; } });
Object.defineProperty(exports, "ROOT", { enumerable: true, get: function () { return traceable_js_2.ROOT; } });
