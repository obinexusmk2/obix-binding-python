import { describe, expect, it } from 'vitest';
import { createGILManager } from '../src/gil-manager';

describe('createGILManager', () => {
  it('starts in released state', () => {
    const gil = createGILManager();
    expect(gil.getState()).toBe('released');
  });

  it('acquire sets state to held', () => {
    const gil = createGILManager();
    gil.acquire();
    expect(gil.getState()).toBe('held');
  });

  it('release sets state to released', () => {
    const gil = createGILManager();
    gil.acquire();
    gil.release();
    expect(gil.getState()).toBe('released');
  });

  it('acquire increments acquireCount', () => {
    const gil = createGILManager();
    gil.acquire();
    expect(gil.getStats().acquireCount).toBe(1);
    gil.release();
    gil.acquire();
    expect(gil.getStats().acquireCount).toBe(2);
  });

  it('release increments releaseCount', () => {
    const gil = createGILManager();
    gil.acquire();
    gil.release();
    expect(gil.getStats().releaseCount).toBe(1);
  });

  it('acquiring when already held increments contentionCount', () => {
    const gil = createGILManager();
    gil.acquire();
    gil.acquire(); // contention
    gil.acquire(); // contention
    const stats = gil.getStats();
    expect(stats.contentionCount).toBe(2);
    expect(stats.acquireCount).toBe(1); // only first acquire counts
  });

  it('releasing when already released is a no-op', () => {
    const gil = createGILManager();
    gil.release();
    expect(gil.getStats().releaseCount).toBe(0);
  });

  it('getStats returns full stats', () => {
    const gil = createGILManager();
    gil.acquire();
    gil.release();
    gil.acquire();
    gil.acquire(); // contention
    expect(gil.getStats()).toEqual({
      acquireCount: 2,
      releaseCount: 1,
      contentionCount: 1,
      currentState: 'held',
    });
  });

  it('reset zeroes all fields', () => {
    const gil = createGILManager();
    gil.acquire();
    gil.acquire();
    gil.release();
    gil.reset();
    expect(gil.getStats()).toEqual({
      acquireCount: 0,
      releaseCount: 0,
      contentionCount: 0,
      currentState: 'released',
    });
  });

  it('destroy calls reset', () => {
    const gil = createGILManager();
    gil.acquire();
    gil.destroy();
    expect(gil.getState()).toBe('released');
    expect(gil.getStats().acquireCount).toBe(0);
  });
});
