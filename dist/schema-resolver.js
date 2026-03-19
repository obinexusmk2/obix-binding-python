const VALID_MODES = ['monoglot', 'polyglot', 'hybrid'];
export function createSchemaResolver(config) {
    const mode = config.schemaMode;
    return {
        resolve() {
            return {
                mode,
                version: config.pythonVersion ?? 'unknown',
                supportsMultiLanguage: mode === 'polyglot' || mode === 'hybrid',
                ctypesSupport: true, // Python always has ctypes
                cffiEnabled: mode === 'polyglot' || mode === 'hybrid',
                numpyInterop: mode === 'polyglot',
            };
        },
        validate(m) {
            return VALID_MODES.includes(m);
        },
        getMode() {
            return mode;
        },
        destroy() {
            // Stateless
        },
    };
}
//# sourceMappingURL=schema-resolver.js.map