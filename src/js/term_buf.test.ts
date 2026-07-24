// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';

import { TermBuf } from './term_buf';

describe('TermBuf resource limits', () => {
  it('clamps dimensions during construction and resize', () => {
    const termbuf = new TermBuf(2001, 2);

    expect(termbuf.cols).toBe(1000);
    expect(termbuf.rows).toBe(2);

    termbuf.resize(2, 2001);

    expect(termbuf.cols).toBe(2);
    expect(termbuf.rows).toBe(1000);
    expect(termbuf.lines).toHaveLength(1000);
  });
});