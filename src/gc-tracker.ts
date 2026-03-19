import type { GCTrackerAPI, GCTrackerConfig, PythonGCStats } from './types.js';

export function createGCTracker(config: GCTrackerConfig = {}): GCTrackerAPI {
  let refCount = 0;
  let cycleCollections = 0;
  let generation0Size = 0;
  let generation1Size = 0;
  let generation2Size = 0;
  let gcEnabled = config.gcEnabled ?? true;
  let totalFreed = 0;

  const tracker: GCTrackerAPI = {
    snapshot(): PythonGCStats {
      return {
        refCount,
        cycleCollections,
        generation0Size,
        generation1Size,
        generation2Size,
        gcEnabled,
        totalFreed,
      };
    },

    recordRef(): void {
      refCount++;
      // New references start in generation 0
      generation0Size++;
    },

    recordDeref(): void {
      if (refCount > 0) refCount--;
      // Simple deref reduces gen0 first, then gen1, then gen2
      if (generation0Size > 0) {
        generation0Size--;
      } else if (generation1Size > 0) {
        generation1Size--;
      } else if (generation2Size > 0) {
        generation2Size--;
      }
      totalFreed++;
    },

    collectGeneration(gen: 0 | 1 | 2): number {
      if (!gcEnabled) return 0;
      cycleCollections++;

      let freed = 0;
      if (gen === 0) {
        // Gen 0: youngest, most collected, ~30% freed
        freed = Math.floor(generation0Size * 0.3);
        const survivors = Math.floor((generation0Size - freed) * 0.5);
        generation0Size -= freed + survivors;
        generation1Size += survivors;
      } else if (gen === 1) {
        // Gen 1: middle, ~20% freed
        freed = Math.floor(generation1Size * 0.2);
        const survivors = Math.floor((generation1Size - freed) * 0.3);
        generation1Size -= freed + survivors;
        generation2Size += survivors;
      } else {
        // Gen 2: oldest, ~10% freed
        freed = Math.floor(generation2Size * 0.1);
        generation2Size -= freed;
      }

      totalFreed += freed;
      return freed;
    },

    collectAll(): number {
      if (!gcEnabled) return 0;
      let total = 0;
      total += tracker.collectGeneration(0);
      total += tracker.collectGeneration(1);
      total += tracker.collectGeneration(2);
      return total;
    },

    setEnabled(enabled: boolean): void {
      gcEnabled = enabled;
    },

    reset(): void {
      refCount = 0;
      cycleCollections = 0;
      generation0Size = 0;
      generation1Size = 0;
      generation2Size = 0;
      gcEnabled = config.gcEnabled ?? true;
      totalFreed = 0;
    },

    destroy(): void {
      tracker.reset();
    },
  };

  return tracker;
}
