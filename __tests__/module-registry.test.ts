import { describe, expect, it } from 'vitest';
import { createModuleRegistry } from '../src/module-registry';

describe('createModuleRegistry', () => {
  it('register returns a module with correct fields', () => {
    const registry = createModuleRegistry();
    const mod = registry.register('numpy', '1.26.0', '/usr/lib/python3/numpy');
    expect(mod.name).toBe('numpy');
    expect(mod.version).toBe('1.26.0');
    expect(mod.path).toBe('/usr/lib/python3/numpy');
    expect(mod.loaded).toBe(true);
  });

  it('register uses defaults for version and path', () => {
    const registry = createModuleRegistry();
    const mod = registry.register('pandas');
    expect(mod.version).toBe('unknown');
    expect(mod.path).toBe('');
  });

  it('get retrieves a previously registered module', () => {
    const registry = createModuleRegistry();
    registry.register('torch', '2.0');
    const mod = registry.get('torch');
    expect(mod).toBeDefined();
    expect(mod!.name).toBe('torch');
  });

  it('get returns undefined for unknown module', () => {
    const registry = createModuleRegistry();
    expect(registry.get('nonexistent')).toBeUndefined();
  });

  it('unload marks module as not loaded', () => {
    const registry = createModuleRegistry();
    registry.register('scipy');
    registry.unload('scipy');
    const mod = registry.get('scipy');
    expect(mod).toBeDefined();
    expect(mod!.loaded).toBe(false);
  });

  it('listNames returns all registered module names', () => {
    const registry = createModuleRegistry();
    registry.register('a');
    registry.register('b');
    registry.register('c');
    expect(registry.listNames().sort()).toEqual(['a', 'b', 'c']);
  });

  it('listLoaded returns only loaded modules', () => {
    const registry = createModuleRegistry();
    registry.register('x');
    registry.register('y');
    registry.register('z');
    registry.unload('y');
    const loaded = registry.listLoaded();
    expect(loaded).toHaveLength(2);
    expect(loaded.map(m => m.name).sort()).toEqual(['x', 'z']);
  });

  it('destroy unloads all modules and clears registry', () => {
    const registry = createModuleRegistry();
    registry.register('a');
    registry.register('b');
    registry.destroy();
    expect(registry.listNames()).toHaveLength(0);
    expect(registry.listLoaded()).toHaveLength(0);
  });
});
