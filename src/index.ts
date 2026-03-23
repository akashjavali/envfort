export { createEnv } from './core/createEnv.js';
export type {
  EnvSchema,
  SchemaEntry,
  SchemaDescriptor,
  SchemaTypeString,
  InferEnv,
  CreateEnvOptions,
} from './core/types.js';
export { REDACTED, looksLikeSecret } from './guard/redact.js';
