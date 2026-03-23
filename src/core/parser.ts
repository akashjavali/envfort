import type { EnvSchema, InferEnv, SchemaEntry, ResolvedDescriptor } from './types.js';

type RawEnv = Record<string, string | undefined>;

/** Unique sentinel — distinct from any valid parsed value. */
const MISSING = Symbol('MISSING');

function resolveDescriptor(entry: SchemaEntry): ResolvedDescriptor {
  if (typeof entry === 'string') return { type: entry };
  return entry as ResolvedDescriptor;
}

function coerce(key: string, raw: string, baseType: string): unknown {
  if (baseType === 'string') return raw;

  if (baseType === 'number') {
    const n = Number(raw);
    if (Number.isNaN(n)) {
      throw new Error(
        `Invalid value for env variable ${key}: expected a number, got "${raw}"`,
      );
    }
    return n;
  }

  if (baseType === 'boolean') {
    if (raw === 'true' || raw === '1') return true;
    if (raw === 'false' || raw === '0') return false;
    throw new Error(
      `Invalid value for env variable ${key}: expected "true", "false", "1", or "0"`,
    );
  }

  // Future: 'url' | 'email' | 'port' — add new branches here
  throw new Error(`Unknown schema type: "${baseType}" for key "${key}"`);
}

function parseSingleValue(
  key: string,
  rawValue: string | undefined,
  desc: ResolvedDescriptor,
): unknown {
  const isOptional = desc.type.endsWith('?');
  const baseType = desc.type.replace('?', '');

  if (rawValue === undefined || rawValue === '') {
    if (desc.default !== undefined) return desc.default;
    if (isOptional) return undefined;
    return MISSING;
  }

  return coerce(key, rawValue, baseType);
}

/**
 * Validates and coerces raw environment variables against a schema.
 * Throws a descriptive, developer-friendly error on failure.
 * Collects ALL missing required variables before throwing.
 */
export function parseEnv<S extends EnvSchema>(
  schema: S,
  rawEnv: RawEnv,
): InferEnv<S> {
  const result: Record<string, unknown> = {};
  const missing: string[] = [];

  for (const [key, entry] of Object.entries(schema)) {
    const desc = resolveDescriptor(entry);
    const parsed = parseSingleValue(key, rawEnv[key], desc);

    if (parsed === MISSING) {
      missing.push(key);
    } else {
      result[key] = parsed;
    }
  }

  if (missing.length === 1) {
    throw new Error(`Missing required env variable: ${missing[0]!}`);
  }
  if (missing.length > 1) {
    throw new Error(`Missing required env variables: ${missing.join(', ')}`);
  }

  return result as InferEnv<S>;
}
