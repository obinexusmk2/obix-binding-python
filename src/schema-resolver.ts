import type {
  PythonResolvedSchema,
  PythonSchemaResolverAPI,
  PythonSchemaResolverConfig,
  SchemaMode,
} from './types.js';

const VALID_MODES: readonly SchemaMode[] = ['monoglot', 'polyglot', 'hybrid'];

export function createSchemaResolver(config: PythonSchemaResolverConfig): PythonSchemaResolverAPI {
  const mode = config.schemaMode;

  return {
    resolve(): PythonResolvedSchema {
      return {
        mode,
        version: config.pythonVersion ?? 'unknown',
        supportsMultiLanguage: mode === 'polyglot' || mode === 'hybrid',
        ctypesSupport: true, // Python always has ctypes
        cffiEnabled: mode === 'polyglot' || mode === 'hybrid',
        numpyInterop: mode === 'polyglot',
      };
    },

    validate(m: SchemaMode): boolean {
      return (VALID_MODES as readonly string[]).includes(m);
    },

    getMode(): SchemaMode {
      return mode;
    },

    destroy(): void {
      // Stateless
    },
  };
}
