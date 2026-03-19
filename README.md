# @obinexusltd/obix-binding-python

OBIX Python Binding — ML/AI integration and data science workflows. Connects the libpolycall FFI/polyglot bridge to the Python runtime.

## Installation

```bash
npm install @obinexusltd/obix-binding-python
```

## Quick Start

```typescript
import { createPythonBinding } from '@obinexusltd/obix-binding-python';

const binding = createPythonBinding({
  ffiPath: '/path/to/libpolycall.so',
  pythonPath: '/usr/bin/python3',
  schemaMode: 'hybrid',
  memoryModel: 'gc',
});

await binding.initialize();

const result = await binding.invoke('my_python_function', [1, 2, 3]);

await binding.destroy();
```

## Architecture

The binding is composed of six sub-modules, each accessible as a readonly property on the bridge:

| Module | Property | Description |
|---|---|---|
| FFI Transport | `ffiTransport` | Envelope building, function ID normalization, ABI dispatch |
| GC Tracker | `gcTracker` | Python generational garbage collector simulation (gen0/gen1/gen2) |
| GIL Manager | `gilManager` | Global Interpreter Lock state and contention tracking |
| Asyncio Executor | `asyncioExecutor` | asyncio-like cooperative FIFO task executor |
| Module Registry | `moduleRegistry` | Python module/package registration and lifecycle |
| Schema Resolver | `schemaResolver` | Schema mode resolution with ctypes/cffi/numpy properties |

## Configuration

```typescript
interface PythonBindingConfig {
  ffiPath: string;            // Path to native FFI library (required)
  pythonPath: string;         // Path to Python interpreter (required)
  schemaMode: SchemaMode;     // 'monoglot' | 'polyglot' | 'hybrid' (required)
  memoryModel: 'gc' | 'manual' | 'hybrid'; // Memory management strategy (required)
  virtualEnv?: string;        // Virtual environment path
  pythonVersion?: string;     // Python version string
  numpyInterop?: boolean;     // Enable numpy array interop
  pandasInterop?: boolean;    // Enable pandas DataFrame interop
  torchInterop?: boolean;     // Enable PyTorch tensor interop
  tensorflowInterop?: boolean; // Enable TensorFlow interop
  executorPoolSize?: number;  // Asyncio executor concurrency (default: 4)
  gcCollectCyclesInterval?: number; // GC cycle collection interval
}
```

## Schema Modes

| Mode | ctypes | cffi | numpy | Multi-language |
|---|---|---|---|---|
| `monoglot` | Yes | No | No | No |
| `polyglot` | Yes | Yes | Yes | Yes |
| `hybrid` | Yes | Yes | No | Yes |

## Sub-module Usage

### GC Tracker

```typescript
const { gcTracker } = binding;

gcTracker.recordRef();           // Track reference creation
gcTracker.recordDeref();         // Track reference release
gcTracker.collectGeneration(0);  // Collect youngest generation
gcTracker.collectAll();          // Full collection cycle
gcTracker.snapshot();            // Get current GC stats
```

### GIL Manager

```typescript
const { gilManager } = binding;

gilManager.acquire();   // Acquire the GIL
gilManager.release();   // Release the GIL
gilManager.getState();  // 'held' | 'released'
gilManager.getStats();  // { acquireCount, releaseCount, contentionCount, currentState }
```

### Asyncio Executor

```typescript
const { asyncioExecutor } = binding;

const result = await asyncioExecutor.submit('task-1', 'async_fn', [arg1]);
const stats = asyncioExecutor.getStats(); // { activeTasks, queuedTasks, completedTasks }
await asyncioExecutor.drain();            // Wait for all tasks to complete
```

### Module Registry

```typescript
const { moduleRegistry } = binding;

moduleRegistry.register('numpy', '1.26.0', '/usr/lib/python3/numpy');
moduleRegistry.get('numpy');      // { name, version, path, loaded }
moduleRegistry.listLoaded();      // All currently loaded modules
moduleRegistry.unload('numpy');   // Mark module as unloaded
```

## Development

```bash
npm run build   # Compile TypeScript
npm run test    # Run test suite
```

## License

MIT
