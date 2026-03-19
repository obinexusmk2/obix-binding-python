import type { ModuleRegistryAPI, PythonModule } from './types.js';

interface MutableModule {
  name: string;
  version: string;
  path: string;
  loaded: boolean;
}

export function createModuleRegistry(): ModuleRegistryAPI {
  const modules = new Map<string, MutableModule>();

  return {
    register(name: string, version: string = 'unknown', path: string = ''): PythonModule {
      const mod: MutableModule = { name, version, path, loaded: true };
      modules.set(name, mod);
      return { ...mod };
    },

    get(name: string): PythonModule | undefined {
      const mod = modules.get(name);
      return mod ? { ...mod } : undefined;
    },

    unload(name: string): void {
      const mod = modules.get(name);
      if (mod) {
        mod.loaded = false;
      }
    },

    listNames(): string[] {
      return Array.from(modules.keys());
    },

    listLoaded(): PythonModule[] {
      const result: PythonModule[] = [];
      for (const mod of modules.values()) {
        if (mod.loaded) result.push({ ...mod });
      }
      return result;
    },

    destroy(): void {
      for (const mod of modules.values()) {
        mod.loaded = false;
      }
      modules.clear();
    },
  };
}
