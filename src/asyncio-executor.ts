import type {
  AsyncioExecutorAPI,
  AsyncioExecutorConfig,
  AsyncioStats,
  AsyncioTask,
  FFITransportAPI,
} from './types.js';

import { normalizeFunctionIdentifier } from './ffi-transport.js';

export function createAsyncioExecutor(
  transport: FFITransportAPI,
  config: AsyncioExecutorConfig,
): AsyncioExecutorAPI {
  const poolSize = Math.max(1, config.poolSize);
  const queue: AsyncioTask[] = [];
  let activeTasks = 0;
  let completedTasks = 0;
  let destroyed = false;

  function drainLoop(): void {
    while (queue.length > 0 && activeTasks < poolSize) {
      const task = queue.shift()!;
      activeTasks++;

      const fnId = normalizeFunctionIdentifier(task.fn) ?? '<unknown>';
      const envelope = transport.buildEnvelope(fnId, task.args);

      transport.dispatch(envelope).then(
        (result) => {
          activeTasks--;
          completedTasks++;
          task.resolve(result);
          drainLoop();
        },
        (err) => {
          activeTasks--;
          completedTasks++;
          task.reject(err);
          drainLoop();
        },
      );
    }
  }

  const executor: AsyncioExecutorAPI = {
    submit(taskId: string, fn: string | object, args: unknown[]): Promise<unknown> {
      if (destroyed) {
        return Promise.reject(new Error('AsyncioExecutor is destroyed'));
      }
      return new Promise<unknown>((resolve, reject) => {
        queue.push({ taskId, fn, args, resolve, reject });
        drainLoop();
      });
    },

    getStats(): AsyncioStats {
      return {
        activeTasks,
        queuedTasks: queue.length,
        completedTasks,
      };
    },

    async drain(): Promise<void> {
      while (queue.length > 0 || activeTasks > 0) {
        await new Promise<void>((r) => setTimeout(r, 0));
      }
    },

    destroy(): void {
      destroyed = true;
      const err = new Error('AsyncioExecutor destroyed');
      for (const task of queue) task.reject(err);
      queue.length = 0;
      activeTasks = 0;
    },
  };

  return executor;
}
