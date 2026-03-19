import type { GILManagerAPI, GILState, GILStats } from './types.js';

export function createGILManager(): GILManagerAPI {
  let currentState: GILState = 'released';
  let acquireCount = 0;
  let releaseCount = 0;
  let contentionCount = 0;

  const manager: GILManagerAPI = {
    acquire(): void {
      if (currentState === 'held') {
        contentionCount++;
        return;
      }
      currentState = 'held';
      acquireCount++;
    },

    release(): void {
      if (currentState === 'released') return;
      currentState = 'released';
      releaseCount++;
    },

    getState(): GILState {
      return currentState;
    },

    getStats(): GILStats {
      return {
        acquireCount,
        releaseCount,
        contentionCount,
        currentState,
      };
    },

    reset(): void {
      currentState = 'released';
      acquireCount = 0;
      releaseCount = 0;
      contentionCount = 0;
    },

    destroy(): void {
      manager.reset();
    },
  };

  return manager;
}
