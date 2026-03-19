import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAsyncioExecutor } from '../src/asyncio-executor';
import type { FFITransportAPI, InvocationEnvelope } from '../src/types';

function makeMockTransport(resolveWith: unknown = { ok: true }): FFITransportAPI {
  return {
    buildEnvelope: (functionId: string, args: unknown[]): InvocationEnvelope => ({
      functionId,
      args,
      metadata: { schemaMode: 'hybrid', binding: 'python', timestampMs: 0, ffiPath: '/mock' },
    }),
    dispatch: vi.fn().mockResolvedValue(resolveWith),
    destroy: vi.fn(),
  };
}

describe('createAsyncioExecutor', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('getStats returns zero counts initially', () => {
    const executor = createAsyncioExecutor(makeMockTransport(), { poolSize: 4 });
    expect(executor.getStats()).toEqual({ activeTasks: 0, queuedTasks: 0, completedTasks: 0 });
  });

  it('submit dispatches a task through the transport', async () => {
    const transport = makeMockTransport({ ok: true });
    const executor = createAsyncioExecutor(transport, { poolSize: 4 });
    const result = await executor.submit('t1', 'doSomething', [1, 2]);
    expect(result).toEqual({ ok: true });
    expect(transport.dispatch).toHaveBeenCalledTimes(1);
  });

  it('completedTasks increments after each resolution', async () => {
    const executor = createAsyncioExecutor(makeMockTransport(), { poolSize: 4 });
    await executor.submit('t1', 'fn', []);
    await executor.submit('t2', 'fn', []);
    expect(executor.getStats().completedTasks).toBe(2);
  });

  it('respects poolSize concurrency bound', async () => {
    let releaseFn!: () => void;
    const slowTransport: FFITransportAPI = {
      buildEnvelope: (id, args) => ({
        functionId: id, args,
        metadata: { schemaMode: 'hybrid', binding: 'python', timestampMs: 0, ffiPath: '/mock' },
      }),
      dispatch: vi.fn().mockImplementation(() => new Promise<unknown>((r) => { releaseFn = () => r({ ok: true }); })),
      destroy: vi.fn(),
    };

    const executor = createAsyncioExecutor(slowTransport, { poolSize: 1 });

    const p1 = executor.submit('t1', 'fn', []);
    const p2 = executor.submit('t2', 'fn', []);
    const p3 = executor.submit('t3', 'fn', []);

    await Promise.resolve();
    expect(executor.getStats().activeTasks).toBe(1);
    expect(executor.getStats().queuedTasks).toBe(2);

    releaseFn();
    await p1;
    releaseFn();
    await p2;
    releaseFn();
    await p3;

    expect(executor.getStats().completedTasks).toBe(3);
    expect(executor.getStats().queuedTasks).toBe(0);
  });

  it('submit rejects after destroy', async () => {
    const executor = createAsyncioExecutor(makeMockTransport(), { poolSize: 2 });
    executor.destroy();
    await expect(executor.submit('t', 'fn', [])).rejects.toThrow('destroyed');
  });

  it('destroy rejects all queued tasks', async () => {
    let releaseFn!: () => void;
    const blockingTransport: FFITransportAPI = {
      buildEnvelope: (id, args) => ({
        functionId: id, args,
        metadata: { schemaMode: 'hybrid', binding: 'python', timestampMs: 0, ffiPath: '/mock' },
      }),
      dispatch: vi.fn().mockImplementation(() => new Promise<unknown>((r) => { releaseFn = () => r({ ok: true }); })),
      destroy: vi.fn(),
    };

    const executor = createAsyncioExecutor(blockingTransport, { poolSize: 1 });

    const p1 = executor.submit('t1', 'fn', []);
    const p2 = executor.submit('t2', 'fn', []);

    await Promise.resolve();

    executor.destroy();

    await expect(p2).rejects.toThrow('destroyed');

    releaseFn();
    await p1.catch(() => {});
  });

  it('drain resolves once all tasks complete', async () => {
    const executor = createAsyncioExecutor(makeMockTransport(), { poolSize: 2 });
    executor.submit('t1', 'fn', []);
    executor.submit('t2', 'fn', []);
    await executor.drain();
    const stats = executor.getStats();
    expect(stats.queuedTasks).toBe(0);
    expect(stats.activeTasks).toBe(0);
    expect(stats.completedTasks).toBe(2);
  });
});
