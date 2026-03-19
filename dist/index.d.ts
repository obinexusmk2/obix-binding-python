/**
 * OBIX Python Binding
 * ML/AI integration, data science workflows
 * Connects libpolycall FFI/polyglot bridge to Python runtime
 */
export type { SchemaMode, InvocationEnvelope, BindingInvokeError, BindingAbiInvoker, PythonFFIDescriptor, PythonBindingConfig, PythonBindingBridge, PythonGCStats, GCTrackerConfig, GCTrackerAPI, GILState, GILStats, GILManagerAPI, AsyncioExecutorConfig, AsyncioTask, AsyncioStats, AsyncioExecutorAPI, PythonModule, ModuleRegistryAPI, PythonSchemaResolverConfig, PythonResolvedSchema, PythonSchemaResolverAPI, FFITransportConfig, FFITransportAPI, } from './types.js';
export { createFFITransport, normalizeFunctionIdentifier } from './ffi-transport.js';
export { createGCTracker } from './gc-tracker.js';
export { createGILManager } from './gil-manager.js';
export { createAsyncioExecutor } from './asyncio-executor.js';
export { createModuleRegistry } from './module-registry.js';
export { createSchemaResolver } from './schema-resolver.js';
import type { PythonBindingBridge, PythonBindingConfig } from './types.js';
/**
 * Create a Python binding to libpolycall
 * @param config Configuration for the binding
 * @returns Bridge for invoking polyglot functions and managing Python runtime state
 */
export declare function createPythonBinding(config: PythonBindingConfig): PythonBindingBridge;
//# sourceMappingURL=index.d.ts.map