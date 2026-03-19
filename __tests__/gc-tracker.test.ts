import { describe, expect, it } from 'vitest';
import { createGCTracker } from '../src/gc-tracker';

describe('createGCTracker', () => {
  it('snapshot returns zero stats initially', () => {
    const tracker = createGCTracker();
    expect(tracker.snapshot()).toEqual({
      refCount: 0,
      cycleCollections: 0,
      generation0Size: 0,
      generation1Size: 0,
      generation2Size: 0,
      gcEnabled: true,
      totalFreed: 0,
    });
  });

  it('recordRef increments refCount and generation0Size', () => {
    const tracker = createGCTracker();
    tracker.recordRef();
    tracker.recordRef();
    const snap = tracker.snapshot();
    expect(snap.refCount).toBe(2);
    expect(snap.generation0Size).toBe(2);
  });

  it('recordDeref decrements refCount and increments totalFreed', () => {
    const tracker = createGCTracker();
    tracker.recordRef();
    tracker.recordRef();
    tracker.recordDeref();
    const snap = tracker.snapshot();
    expect(snap.refCount).toBe(1);
    expect(snap.generation0Size).toBe(1);
    expect(snap.totalFreed).toBe(1);
  });

  it('recordDeref does not go below zero refCount', () => {
    const tracker = createGCTracker();
    tracker.recordDeref();
    expect(tracker.snapshot().refCount).toBe(0);
  });

  it('collectGeneration(0) frees ~30% of gen0 and promotes survivors to gen1', () => {
    const tracker = createGCTracker();
    for (let i = 0; i < 100; i++) tracker.recordRef();
    const freed = tracker.collectGeneration(0);
    const snap = tracker.snapshot();
    expect(freed).toBe(30);
    expect(snap.generation0Size).toBeLessThan(100);
    expect(snap.generation1Size).toBeGreaterThan(0);
    expect(snap.cycleCollections).toBe(1);
  });

  it('collectGeneration(1) frees ~20% of gen1 and promotes survivors to gen2', () => {
    const tracker = createGCTracker();
    // Manually populate gen1 via gen0 collection
    for (let i = 0; i < 100; i++) tracker.recordRef();
    tracker.collectGeneration(0); // promotes some to gen1
    const gen1Before = tracker.snapshot().generation1Size;
    const freed = tracker.collectGeneration(1);
    const snap = tracker.snapshot();
    expect(freed).toBe(Math.floor(gen1Before * 0.2));
    expect(snap.generation2Size).toBeGreaterThan(0);
  });

  it('collectGeneration(2) frees ~10% of gen2', () => {
    const tracker = createGCTracker();
    for (let i = 0; i < 100; i++) tracker.recordRef();
    tracker.collectGeneration(0);
    tracker.collectGeneration(1);
    const gen2Before = tracker.snapshot().generation2Size;
    const freed = tracker.collectGeneration(2);
    expect(freed).toBe(Math.floor(gen2Before * 0.1));
  });

  it('collectAll runs all 3 generations', () => {
    const tracker = createGCTracker();
    for (let i = 0; i < 100; i++) tracker.recordRef();
    const totalFreed = tracker.collectAll();
    expect(totalFreed).toBeGreaterThan(0);
    expect(tracker.snapshot().cycleCollections).toBe(3);
  });

  it('collection does nothing when gc is disabled', () => {
    const tracker = createGCTracker();
    for (let i = 0; i < 50; i++) tracker.recordRef();
    tracker.setEnabled(false);
    const freed = tracker.collectAll();
    expect(freed).toBe(0);
    expect(tracker.snapshot().cycleCollections).toBe(0);
  });

  it('setEnabled toggles gc state', () => {
    const tracker = createGCTracker();
    expect(tracker.snapshot().gcEnabled).toBe(true);
    tracker.setEnabled(false);
    expect(tracker.snapshot().gcEnabled).toBe(false);
    tracker.setEnabled(true);
    expect(tracker.snapshot().gcEnabled).toBe(true);
  });

  it('reset zeroes all fields', () => {
    const tracker = createGCTracker();
    for (let i = 0; i < 10; i++) tracker.recordRef();
    tracker.collectAll();
    tracker.reset();
    expect(tracker.snapshot()).toEqual({
      refCount: 0,
      cycleCollections: 0,
      generation0Size: 0,
      generation1Size: 0,
      generation2Size: 0,
      gcEnabled: true,
      totalFreed: 0,
    });
  });

  it('destroy calls reset', () => {
    const tracker = createGCTracker();
    tracker.recordRef();
    tracker.destroy();
    expect(tracker.snapshot().refCount).toBe(0);
  });
});
