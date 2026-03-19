/**
 * OBIX Python Binding
 * ML/AI integration, data science workflows
 * Connects libpolycall FFI/polyglot bridge to Python runtime
 */
// ── Sub-module factory re-exports ─────────────────────────────────────────────
export { createFFITransport, normalizeFunctionIdentifier } from './ffi-transport.js';
export { createGCTracker } from './gc-tracker.js';
export { createGILManager } from './gil-manager.js';
export { createAsyncioExecutor } from './asyncio-executor.js';
export { createModuleRegistry } from './module-registry.js';
export { createSchemaResolver } from './schema-resolver.js';
import { createFFITransport, normalizeFunctionIdentifier } from './ffi-transport.js';
import { createGCTracker } from './gc-tracker.js';
import { createGILManager } from './gil-manager.js';
import { createAsyncioExecutor } from './asyncio-executor.js';
import { createModuleRegistry } from './module-registry.js';
import { createSchemaResolver } from './schema-resolver.js';
// ── Main factory ──────────────────────────────────────────────────────────────
/**
 * Create a Python binding to libpolycall
 * @param config Configuration for the binding
 * @returns Bridge for invoking polyglot functions and managing Python runtime state
 */
export function createPythonBinding(config) {
    let initialized = false;
    const ABI_BINDING_NAME = 'python';
    const ffiTransport = createFFITransport({
        ffiPath: config.ffiPath,
        schemaMode: config.schemaMode,
        bindingName: ABI_BINDING_NAME,
    });
    const asyncioExecutor = createAsyncioExecutor(ffiTransport, {
        poolSize: config.executorPoolSize ?? 4,
    });
    const moduleRegistry = createModuleRegistry();
    const gcTracker = createGCTracker({
        gcEnabled: true,
    });
    const gilManager = createGILManager();
    const schemaResolver = createSchemaResolver({
        schemaMode: config.schemaMode,
        pythonVersion: config.pythonVersion ?? config.ffiDescriptor?.pythonVersion,
    });
    const bridge = {
        async initialize() {
            if (typeof config.ffiPath !== 'string' || config.ffiPath.trim().length === 0) {
                throw new Error(`Invalid ffiPath: ${config.ffiPath}`);
            }
            if (!schemaResolver.validate(config.schemaMode)) {
                throw new Error(`Invalid schemaMode: ${config.schemaMode}`);
            }
            initialized = true;
        },
        async invoke(fn, args) {
            const functionId = normalizeFunctionIdentifier(fn);
            const envelope = ffiTransport.buildEnvelope(functionId ?? '<unknown>', args);
            if (!initialized) {
                return { code: 'NOT_INITIALIZED', message: 'Binding is not initialized', envelope };
            }
            if (!functionId) {
                return { code: 'MISSING_SYMBOL', message: 'Function identifier was not provided', envelope };
            }
            return ffiTransport.dispatch(envelope);
        },
        async destroy() {
            asyncioExecutor.destroy();
            moduleRegistry.destroy();
            gcTracker.destroy();
            gilManager.destroy();
            ffiTransport.destroy();
            schemaResolver.destroy();
            initialized = false;
        },
        getMemoryUsage() {
            return gcTracker.snapshot();
        },
        getSchemaMode() {
            return schemaResolver.getMode();
        },
        isInitialized() {
            return initialized;
        },
        async submitTask(taskId, fn, args) {
            if (!initialized) {
                return { code: 'NOT_INITIALIZED', message: 'Binding is not initialized' };
            }
            return asyncioExecutor.submit(taskId, fn, args);
        },
        getExecutorStats() {
            return asyncioExecutor.getStats();
        },
        async forceGarbageCollection() {
            return gcTracker.collectAll();
        },
        get ffiTransport() { return ffiTransport; },
        get asyncioExecutor() { return asyncioExecutor; },
        get moduleRegistry() { return moduleRegistry; },
        get gcTracker() { return gcTracker; },
        get gilManager() { return gilManager; },
        get schemaResolver() { return schemaResolver; },
    };
    return bridge;
}
//# sourceMappingURL=index.js.map