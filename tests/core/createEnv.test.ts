import { describe, it, expect, vi } from 'vitest';
import { createEnv } from '../../src/core/createEnv.js';
import { REDACTED } from '../../src/guard/redact.js';

describe('createEnv — basic validation', () => {
  it('returns typed values', () => {
    const env = createEnv(
      { HOST: 'string', PORT: 'number', DEBUG: 'boolean' },
      { env: { HOST: 'localhost', PORT: '8080', DEBUG: 'true' } },
    );
    expect(env.HOST).toBe('localhost');
    expect(env.PORT).toBe(8080);
    expect(env.DEBUG).toBe(true);
  });

  it('throws on missing required variable', () => {
    expect(() => createEnv({ SECRET: 'string' }, { env: {} }))
      .toThrow('Missing required env variable: SECRET');
  });

  it('returns undefined for missing optional', () => {
    expect(createEnv({ PORT: 'number?' }, { env: {} }).PORT).toBeUndefined();
  });

  it('applies default values', () => {
    const env = createEnv(
      { PORT: { type: 'number?', default: 3000 } },
      { env: {} },
    );
    expect(env.PORT).toBe(3000);
  });
});

describe('createEnv — secret detection warnings', () => {
  it('warns to console.warn when a non-secret var has a secret-looking value', () => {
    const warns: unknown[] = [];
    const orig = console.warn;
    console.warn = (...args: unknown[]) => warns.push(args);
    createEnv(
      { HOST: 'string' },
      { env: { HOST: 'sk-abc123def456ghijklmno' } },
    );
    console.warn = orig;
    expect(warns.length).toBeGreaterThan(0);
    expect(String(warns[0])).toContain('HOST');
  });
});

describe('createEnv — redaction', () => {
  it('redacts values in JSON.stringify', () => {
    const env = createEnv(
      { API_KEY: 'string' },
      { redact: true, env: { API_KEY: 'sk-secret' } },
    );
    expect(JSON.stringify(env)).not.toContain('sk-secret');
    expect(JSON.stringify(env)).toContain(REDACTED);
  });

  it('redacts in template literals', () => {
    const env = createEnv(
      { API_KEY: 'string' },
      { redact: true, env: { API_KEY: 'sk-secret' } },
    );
    expect(`${env}`).not.toContain('sk-secret');
  });

  it('returns real value for non-secret runtime access', () => {
    const env = createEnv(
      { API_KEY: 'string' },
      { redact: true, env: { API_KEY: 'sk-secret' } },
    );
    expect(env.API_KEY).toBe('sk-secret');
  });

  it('always redacts keys marked secret: true', () => {
    const env = createEnv(
      { API_KEY: { type: 'string', secret: true } },
      { redact: true, env: { API_KEY: 'sk-secret' } },
    );
    expect(env.API_KEY).toBe(REDACTED);
  });
});

describe('createEnv — frozen object (no redaction)', () => {
  it('returns a frozen object when redact is false', () => {
    const env = createEnv({ PORT: 'number' }, { env: { PORT: '3000' } });
    expect(Object.isFrozen(env)).toBe(true);
  });

  it('prevents mutation of frozen env', () => {
    const env = createEnv({ HOST: 'string' }, { env: { HOST: 'localhost' } });
    expect(() => {
      (env as Record<string, unknown>)['HOST'] = 'hacked';
    }).toThrow();
  });
});

describe('createEnv — TypeScript type inference', () => {
  it('infers correct types from schema', () => {
    const env = createEnv(
      { NAME: 'string', PORT: 'number?', FLAG: 'boolean' },
      { env: { NAME: 'test', FLAG: 'true' } },
    );
    const name: string = env.NAME;
    const port: number | undefined = env.PORT;
    const flag: boolean = env.FLAG;
    expect(name).toBe('test');
    expect(port).toBeUndefined();
    expect(flag).toBe(true);
  });
});
