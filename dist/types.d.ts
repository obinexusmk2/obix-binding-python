/**
 * OBIX Python Binding — shared types
 */
export type SchemaMode = 'monoglot' | 'polyglot' | 'hybrid';
export interface InvocationEnvelope {
    functionId: string;
    args: unknown[];
    metadata: {
        schemaMode: SchemaMode;
        binding: string;
        timestampMs: number;
        ffiPath: string;
    };
}
export interface BindingInvokeError {
    code: 'NOT_INITIALIZED' | 'MISSING_SYMBOL' | 'INVOCATION_FAILED';
    message: string;
    envelope: InvocationEnvelope;
    cause?: unknown;
}
export interface BindingAbiInvoker {
    invoke(envelopeJson: string): unknown | Promise<unknown>;
}
export interface PythonFFIDescriptor {
    ffiPath: string;
    pythonVersion: string;
    ctypesSupport: boolean;
    cffiEnabled: boolean;
    numpyInterop: boolean;
    numpyVersion?: string;
}
export interface PythonBindingConfig {
    ffiPath: string;
    pythonPath: string;
    virtualEnv?: string;
    schemaMode: SchemaMode;
    memoryModel: 'gc' | 'manual' | 'hybrid';
    numpyInterop?: boolean;
    pandasInterop?: boolean;
    torchInterop?: boolean;
    tensorflowInterop?: boolean;
    pythonVersion?: string;
    gcCollectCyclesInterval?: number;
    executorPoolSize?: number;
    ffiDescriptor?: PythonFFIDescriptor;
}
export interface FFITransportConfig {
    ffiPath: string;
    schemaMode: SchemaMode;
    bindingName: string;
}
export interface FFITransportAPI {
    buildEnvelope(functionId: string, args: unknown[]): InvocationEnvelope;
    dispatch(envelope: InvocationEnvelope): Promise<unknown>;
    destroy(): void;
}
export interface PythonGCStats {
    refCount: number;
    cycleCollections: number;
    generation0Size: number;
    generation1Size: number;
    generation2Size: number;
    gcEnabled: boolean;
    totalFreed: number;
}
export interface GCTrackerConfig {
    gcEnabled?: boolean;
}
export interface GCTrackerAPI {
    snapshot(): PythonGCStats;
    recordRef(): void;
    recordDeref(): void;
    collectGeneration(gen: 0 | 1 | 2): number;
    collectAll(): number;
    setEnabled(enabled: boolean): void;
    reset(): void;
    destroy(): void;
}
export type GILState = 'held' | 'released';
export interface GILStats {
    acquireCount: number;
    releaseCount: number;
    contentionCount: number;
    currentState: GILState;
}
export interface GILManagerAPI {
    acquire(): void;
    release(): void;
    getState(): GILState;
    getStats(): GILStats;
    reset(): void;
    destroy(): void;
}
export interface AsyncioExecutorConfig {
    poolSize: number;
}
export interface AsyncioTask {
    taskId: string;
    fn: string | object;
    args: unknown[];
    resolve(result: unknown): void;
    reject(error: unknown): void;
}
export interface AsyncioStats {
    activeTasks: number;
    queuedTasks: number;
    completedTasks: number;
}
export interface AsyncioExecutorAPI {
    submit(taskId: string, fn: string | object, args: unknown[]): Promise<unknown>;
    getStats(): AsyncioStats;
    drain(): Promise<void>;
    destroy(): void;
}
export interface PythonModule {
    readonly name: string;
    readonly version: string;
    readonly path: string;
    readonly loaded: boolean;
}
export interface ModuleRegistryAPI {
    register(name: string, version?: string, path?: string): PythonModule;
    get(name: string): PythonModule | undefined;
    unload(name: string): void;
    listNames(): string[];
    listLoaded(): PythonModule[];
    destroy(): void;
}
export interface PythonSchemaResolverConfig {
    schemaMode: SchemaMode;
    pythonVersion?: string;
}
export interface PythonResolvedSchema {
    mode: SchemaMode;
    version: string;
    supportsMultiLanguage: boolean;
    ctypesSupport: boolean;
    cffiEnabled: boolean;
    numpyInterop: boolean;
}
export interface PythonSchemaResolverAPI {
    resolve(): PythonResolvedSchema;
    validate(mode: SchemaMode): boolean;
    getMode(): SchemaMode;
    destroy(): void;
}
export interface PythonBindingBridge {
    initialize(): Promise<void>;
    invoke(fn: string | object, args: unknown[]): Promise<unknown>;
    destroy(): Promise<void>;
    getMemoryUsage(): PythonGCStats;
    getSchemaMode(): SchemaMode;
    isInitialized(): boolean;
    submitTask(taskId: string, fn: string | object, args: unknown[]): Promise<unknown>;
    getExecutorStats(): AsyncioStats;
    forceGarbageCollection(): Promise<number>;
    readonly ffiTransport: FFITransportAPI;
    readonly asyncioExecutor: AsyncioExecutorAPI;
    readonly moduleRegistry: ModuleRegistryAPI;
    readonly gcTracker: GCTrackerAPI;
    readonly gilManager: GILManagerAPI;
    readonly schemaResolver: PythonSchemaResolverAPI;
}
//# sourceMappingURL=types.d.ts.map