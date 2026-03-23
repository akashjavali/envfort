import { describe, it, expect } from 'vitest';
import { parseEnv } from '../../src/core/parser.js';

describe('parseEnv — required string', () => {
  it('returns value when present', () => {
    expect(parseEnv({ DB: 'string' }, { DB: 'postgres://localhost' }).DB)
      .toBe('postgres://localhost');
  });
  it('throws when missing', () => {
    expect(() => parseEnv({ DB: 'string' }, {}))
      .toThrow('Missing required env variable: DB');
  });
  it('throws when empty string', () => {
    expect(() => parseEnv({ DB: 'string' }, { DB: '' }))
      .toThrow('Missing required env variable: DB');
  });
});

describe('parseEnv — required number', () => {
  it('parses a number string', () => {
    expect(parseEnv({ PORT: 'number' }, { PORT: '3000' }).PORT).toBe(3000);
  });
  it('throws for non-numeric', () => {
    expect(() => parseEnv({ PORT: 'number' }, { PORT: 'abc' }))
      .toThrow('expected a number');
  });
  it('throws when missing', () => {
    expect(() => parseEnv({ PORT: 'number' }, {}))
      .toThrow('Missing required env variable: PORT');
  });
});

describe('parseEnv — required boolean', () => {
  it.each([['true', true], ['1', true], ['false', false], ['0', false]] as const)(
    'parses "%s" as %s', (raw, expected) => {
      expect(parseEnv({ FLAG: 'boolean' }, { FLAG: raw }).FLAG).toBe(expected);
    }
  );
  it('throws for invalid boolean', () => {
    expect(() => parseEnv({ FLAG: 'boolean' }, { FLAG: 'yes' }))
      .toThrow('expected "true", "false", "1", or "0"');
  });
});

describe('parseEnv — optional variables', () => {
  it('returns undefined when absent', () => {
    expect(parseEnv({ PORT: 'number?' }, {}).PORT).toBeUndefined();
  });
  it('parses when present', () => {
    expect(parseEnv({ PORT: 'number?' }, { PORT: '8080' }).PORT).toBe(8080);
  });
  it('returns undefined for optional boolean when absent', () => {
    expect(parseEnv({ FLAG: 'boolean?' }, {}).FLAG).toBeUndefined();
  });
});

describe('parseEnv — default values', () => {
  it('uses numeric default when optional var is absent', () => {
    expect(
      parseEnv({ PORT: { type: 'number?', default: 3000 } }, {}).PORT
    ).toBe(3000);
  });
  it('prefers env value over default', () => {
    expect(
      parseEnv({ PORT: { type: 'number?', default: 3000 } }, { PORT: '9000' }).PORT
    ).toBe(9000);
  });
  it('uses string default', () => {
    expect(
      parseEnv({ HOST: { type: 'string?', default: 'localhost' } }, {}).HOST
    ).toBe('localhost');
  });
  it('uses boolean default false', () => {
    expect(
      parseEnv({ DEBUG: { type: 'boolean?', default: false } }, {}).DEBUG
    ).toBe(false);
  });
  it('uses boolean default true', () => {
    expect(
      parseEnv({ DEBUG: { type: 'boolean?', default: true } }, {}).DEBUG
    ).toBe(true);
  });
});

describe('parseEnv — multiple missing variables', () => {
  it('collects all missing into one error', () => {
    expect(() => parseEnv({ A: 'string', B: 'string', C: 'number' }, {}))
      .toThrow('Missing required env variables: A, B, C');
  });
});

describe('parseEnv — SchemaDescriptor without default', () => {
  it('treats required descriptor without default as required', () => {
    expect(() => parseEnv({ KEY: { type: 'string', secret: true } }, {}))
      .toThrow('Missing required env variable: KEY');
  });
  it('returns value when present', () => {
    expect(parseEnv({ KEY: { type: 'string', secret: true } }, { KEY: 'val' }).KEY)
      .toBe('val');
  });
});
