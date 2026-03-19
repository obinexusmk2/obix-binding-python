export function createModuleRegistry() {
    const modules = new Map();
    return {
        register(name, version = 'unknown', path = '') {
            const mod = { name, version, path, loaded: true };
            modules.set(name, mod);
            return { ...mod };
        },
        get(name) {
            const mod = modules.get(name);
            return mod ? { ...mod } : undefined;
        },
        unload(name) {
            const mod = modules.get(name);
            if (mod) {
                mod.loaded = false;
            }
        },
        listNames() {
            return Array.from(modules.keys());
        },
        listLoaded() {
            const result = [];
            for (const mod of modules.values()) {
                if (mod.loaded)
                    result.push({ ...mod });
            }
            return result;
        },
        destroy() {
            for (const mod of modules.values()) {
                mod.loaded = false;
            }
            modules.clear();
        },
    };
}
//# sourceMappingURL=module-registry.js.map