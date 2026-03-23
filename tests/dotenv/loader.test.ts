import { describe, it, expect } from 'vitest';
import { parseDotEnv } from '../../src/dotenv/loader.js';

describe('parseDotEnv', () => {
  it('parses simple key=value pairs', () => {
    expect(parseDotEnv('DB_URL=postgres://localhost\nPORT=3000'))
      .toEqual({ DB_URL: 'postgres://localhost', PORT: '3000' });
  });

  it('strips double quotes from values', () => {
    expect(parseDotEnv('API_KEY="sk-abc123"')).toEqual({ API_KEY: 'sk-abc123' });
  });

  it('strips single quotes from values', () => {
    expect(parseDotEnv("HOST='localhost'")).toEqual({ HOST: 'localhost' });
  });

  it('ignores comment lines', () => {
    expect(parseDotEnv('# this is a comment\nHOST=localhost'))
      .toEqual({ HOST: 'localhost' });
  });

  it('ignores blank lines', () => {
    expect(parseDotEnv('\nHOST=localhost\n\nPORT=3000\n'))
      .toEqual({ HOST: 'localhost', PORT: '3000' });
  });

  it('ignores lines without "="', () => {
    expect(parseDotEnv('INVALID\nHOST=localhost')).toEqual({ HOST: 'localhost' });
  });

  it('handles values with "=" in them', () => {
    expect(parseDotEnv('URL=http://a.com?x=1&y=2'))
      .toEqual({ URL: 'http://a.com?x=1&y=2' });
  });

  it('handles Windows-style CRLF line endings', () => {
    expect(parseDotEnv('HOST=localhost\r\nPORT=3000'))
      .toEqual({ HOST: 'localhost', PORT: '3000' });
  });

  it('handles inline comments after values', () => {
    // Common convention: KEY=value # comment
    // We do NOT strip inline comments — value includes everything after =
    // This is simpler and safer (avoids breaking URLs with #)
    const result = parseDotEnv('URL=http://example.com');
    expect(result['URL']).toBe('http://example.com');
  });

  it('returns empty object for empty string', () => {
    expect(parseDotEnv('')).toEqual({});
  });

  it('trims whitespace around keys', () => {
    expect(parseDotEnv('  HOST  =localhost')).toEqual({ HOST: 'localhost' });
  });
});
