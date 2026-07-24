import { describe, expect, it, vi } from 'vitest';

import { AnsiParser } from './ansi_parser';

describe('AnsiParser resource limits', () => {
  it('resets an oversized incomplete escape sequence', () => {
    const termbuf = {
      puts: vi.fn()
    };
    const parser = new AnsiParser(termbuf);

    parser.feed(`\x1b[${';'.repeat(4097)}`);

    expect(parser.state).toBe(AnsiParser.STATE_TEXT);
    expect(parser.esc).toBe('');

    parser.feed('safe text');

    expect(termbuf.puts).toHaveBeenCalledWith(expect.stringContaining('safe text'));
  });

  it('clears partial parser state on reset', () => {
    const termbuf = {
      puts: vi.fn()
    };
    const parser = new AnsiParser(termbuf);

    parser.feed('\x1b[12;');
    parser.reset();
    parser.feed('plain text');

    expect(parser.state).toBe(AnsiParser.STATE_TEXT);
    expect(parser.esc).toBe('');
    expect(termbuf.puts).toHaveBeenCalledWith('plain text');
  });
});
