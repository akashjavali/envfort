import { describe, it, expect, vi } from 'vitest';
import { createRedactedProxy } from '../../src/guard/proxy.js';
import { REDACTED } from '../../src/guard/redact.js';
import * as util from 'node:util';

describe('createRedactedProxy — normal property access', () => {
  const env = createRedactedProxy(
    { API_KEY: 'sk-abc123', PORT: 3000, OPTIONAL: undefined },
    new Set<string>(),
  );

  it('returns real string value', () => { expect(env['API_KEY']).toBe('sk-abc123'); });
  it('returns real number value', () => { expect(env['PORT']).toBe(3000); });
  it('returns undefined for absent optional', () => { expect(env['OPTIONAL']).toBeUndefined(); });
});

describe('createRedactedProxy — JSON.stringify', () => {
  it('redacts all defined values', () => {
    const env = createRedactedProxy(
      { API_KEY: 'sk-abc123', PORT: 3000 },
      new Set<string>(),
    );
    const obj = JSON.parse(JSON.stringify(env)) as Record<string, unknown>;
    expect(obj['API_KEY']).toBe(REDACTED);
    expect(obj['PORT']).toBe(REDACTED);
  });

  it('omits undefined optional values', () => {
    const env = createRedactedProxy(
      { API_KEY: 'sk-abc123', PORT: undefined },
      new Set<string>(),
    );
    const obj = JSON.parse(JSON.stringify(env)) as Record<string, unknown>;
    expect(obj['API_KEY']).toBe(REDACTED);
    expect('PORT' in obj).toBe(false);
  });
});

describe('createRedactedProxy — util.inspect / console.log', () => {
  it('redacts values in util.inspect output', () => {
    const env = createRedactedProxy({ API_KEY: 'sk-abc123' }, new Set<string>());
    const inspected = util.inspect(env);
    expect(inspected).not.toContain('sk-abc123');
    expect(inspected).toContain(REDACTED);
  });

  it('hides real values when console.logged', () => {
    const env = createRedactedProxy({ API_KEY: 'sk-abc123' }, new Set<string>());
    const chunks: string[] = [];
    const spy = vi.spyOn(process.stdout, 'write').mockImplementation((c) => {
      chunks.push(String(c));
      return true;
    });
    console.log(env);
    spy.mockRestore();
    expect(chunks.join('')).not.toContain('sk-abc123');
  });
});

describe('createRedactedProxy — toString / template literals', () => {
  it('returns safe string from String()', () => {
    const env = createRedactedProxy({ API_KEY: 'sk-abc123' }, new Set<string>());
    const s = String(env);
    expect(s).not.toContain('sk-abc123');
    expect(s.length).toBeGreaterThan(0);
  });

  it('returns safe string from template literal', () => {
    const env = createRedactedProxy({ API_KEY: 'sk-abc123' }, new Set<string>());
    const result = `Config: ${env}`;
    expect(result).not.toContain('sk-abc123');
    expect(result).toContain('Config:');
  });

  it('returns safe string from concatenation', () => {
    const env = createRedactedProxy({ API_KEY: 'sk-abc123' }, new Set<string>());
    const result = 'Config: ' + env;
    expect(result).not.toContain('sk-abc123');
  });
});

describe('createRedactedProxy — secret keys', () => {
  it('redacts direct access for secret-marked keys', () => {
    const env = createRedactedProxy(
      { API_KEY: 'sk-abc123', HOST: 'localhost' },
      new Set(['API_KEY']),
    );
    expect(env['API_KEY']).toBe(REDACTED);
    expect(env['HOST']).toBe('localhost');
  });
});

describe('createRedactedProxy — runtime usage', () => {
  it('allows using string value in code', () => {
    const env = createRedactedProxy({ API_KEY: 'sk-abc123' }, new Set<string>());
    const header = `Bearer ${env['API_KEY'] as string}`;
    expect(header).toBe('Bearer sk-abc123');
  });

  it('allows arithmetic with number value', () => {
    const env = createRedactedProxy({ PORT: 3000 }, new Set<string>());
    expect((env['PORT'] as number) + 1).toBe(3001);
  });
});
