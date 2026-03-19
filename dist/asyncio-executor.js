import { normalizeFunctionIdentifier } from './ffi-transport.js';
export function createAsyncioExecutor(transport, config) {
    const poolSize = Math.max(1, config.poolSize);
    const queue = [];
    let activeTasks = 0;
    let completedTasks = 0;
    let destroyed = false;
    function drainLoop() {
        while (queue.length > 0 && activeTasks < poolSize) {
            const task = queue.shift();
            activeTasks++;
            const fnId = normalizeFunctionIdentifier(task.fn) ?? '<unknown>';
            const envelope = transport.buildEnvelope(fnId, task.args);
            transport.dispatch(envelope).then((result) => {
                activeTasks--;
                completedTasks++;
                task.resolve(result);
                drainLoop();
            }, (err) => {
                activeTasks--;
                completedTasks++;
                task.reject(err);
                drainLoop();
            });
        }
    }
    const executor = {
        submit(taskId, fn, args) {
            if (destroyed) {
                return Promise.reject(new Error('AsyncioExecutor is destroyed'));
            }
            return new Promise((resolve, reject) => {
                queue.push({ taskId, fn, args, resolve, reject });
                drainLoop();
            });
        },
        getStats() {
            return {
                activeTasks,
                queuedTasks: queue.length,
                completedTasks,
            };
        },
        async drain() {
            while (queue.length > 0 || activeTasks > 0) {
                await new Promise((r) => setTimeout(r, 0));
            }
        },
        destroy() {
            destroyed = true;
            const err = new Error('AsyncioExecutor destroyed');
            for (const task of queue)
                task.reject(err);
            queue.length = 0;
            activeTasks = 0;
        },
    };
    return executor;
}
//# sourceMappingURL=asyncio-executor.js.map