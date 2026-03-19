import { afterEach, describe, expect, it } from 'vitest';
import { createPythonBinding } from '../src/index';

describe('python binding smoke', () => {
  afterEach(() => {
    delete (globalThis as any).__obixAbiInvoker;
  });

  it('toggles initialize/destroy state and uses shared invocation envelope', async () => {
    const ffiPath = '/tmp/obix-python-ffi.mock';

    const binding = createPythonBinding({
      ffiPath,
      schemaMode: 'hybrid',
      memoryModel: 'hybrid',
      pythonPath: '/usr/bin/python3',
    });

    expect(binding.isInitialized()).toBe(false);

    const beforeInit = await binding.invoke('ping', [1]);
    expect(beforeInit).toMatchObject({ code: 'NOT_INITIALIZED' });

    await binding.initialize();
    expect(binding.isInitialized()).toBe(true);

    const noSymbol = await binding.invoke('ping', [1]);
    expect(noSymbol).toMatchObject({ code: 'MISSING_SYMBOL' });

    (globalThis as any).__obixAbiInvoker = {
      invoke: (payload: string) => {
        const envelope = JSON.parse(payload);
        return { ok: true, echo: envelope };
      },
    };

    const result = await binding.invoke('ping', [1, 2, 3]);
    expect(result).toMatchObject({
      ok: true,
      echo: {
        functionId: 'ping',
        args: [1, 2, 3],
        metadata: { binding: 'python', ffiPath },
      },
    });

    await binding.destroy();
    expect(binding.isInitialized()).toBe(false);
  });

  it('getMemoryUsage returns PythonGCStats shape', () => {
    const binding = createPythonBinding({
      ffiPath: '/tmp/test.so',
      schemaMode: 'monoglot',
      memoryModel: 'gc',
      pythonPath: '/usr/bin/python3',
    });

    const mem = binding.getMemoryUsage();
    expect(mem).toEqual({
      refCount: 0,
      cycleCollections: 0,
      generation0Size: 0,
      generation1Size: 0,
      generation2Size: 0,
      gcEnabled: true,
      totalFreed: 0,
    });
  });

  it('getExecutorStats returns AsyncioStats shape', () => {
    const binding = createPythonBinding({
      ffiPath: '/tmp/test.so',
      schemaMode: 'hybrid',
      memoryModel: 'hybrid',
      pythonPath: '/usr/bin/python3',
    });

    expect(binding.getExecutorStats()).toEqual({
      activeTasks: 0,
      queuedTasks: 0,
      completedTasks: 0,
    });
  });

  it('getSchemaMode returns configured mode', () => {
    const binding = createPythonBinding({
      ffiPath: '/tmp/test.so',
      schemaMode: 'polyglot',
      memoryModel: 'gc',
      pythonPath: '/usr/bin/python3',
    });

    expect(binding.getSchemaMode()).toBe('polyglot');
  });

  it('sub-module accessors are defined', () => {
    const binding = createPythonBinding({
      ffiPath: '/tmp/test.so',
      schemaMode: 'hybrid',
      memoryModel: 'hybrid',
      pythonPath: '/usr/bin/python3',
    });

    expect(binding.ffiTransport).toBeDefined();
    expect(binding.asyncioExecutor).toBeDefined();
    expect(binding.moduleRegistry).toBeDefined();
    expect(binding.gcTracker).toBeDefined();
    expect(binding.gilManager).toBeDefined();
    expect(binding.schemaResolver).toBeDefined();
  });

  it('submitTask returns NOT_INITIALIZED before init', async () => {
    const binding = createPythonBinding({
      ffiPath: '/tmp/test.so',
      schemaMode: 'hybrid',
      memoryModel: 'hybrid',
      pythonPath: '/usr/bin/python3',
    });

    const result = await binding.submitTask('t1', 'fn', []);
    expect(result).toMatchObject({ code: 'NOT_INITIALIZED' });
  });

  it('forceGarbageCollection runs GC and returns freed count', async () => {
    const binding = createPythonBinding({
      ffiPath: '/tmp/test.so',
      schemaMode: 'hybrid',
      memoryModel: 'gc',
      pythonPath: '/usr/bin/python3',
    });

    // Add some refs to make GC have work to do
    for (let i = 0; i < 100; i++) binding.gcTracker.recordRef();
    const freed = await binding.forceGarbageCollection();
    expect(freed).toBeGreaterThan(0);
  });
});
