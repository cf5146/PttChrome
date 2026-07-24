import { describe, expect, it } from 'vitest';

import {
  getSafeConnectionUrl,
  parseConnectionUrl
} from './connection_url';

describe('connection URL policy', () => {
  it('maps secure WebSocket Telnet URLs and preserves the port and path', () => {
    expect(parseConnectionUrl('wsstelnet://ptt.example:9443/bbs?room=1')).toEqual({
      url: 'wsstelnet://ptt.example:9443/bbs?room=1',
      protocol: 'wsstelnet',
      hostname: 'ptt.example',
      port: 9443,
      path: '/bbs?room=1',
      socketUrl: 'wss://ptt.example:9443/bbs?room=1',
      easyReadingSupported: true
    });
  });

  it('uses the protocol default port when none is provided', () => {
    expect(parseConnectionUrl('wstelnet://localhost/bbs')?.socketUrl).toBe(
      'ws://localhost/bbs'
    );
    expect(parseConnectionUrl('wsstelnet://ptt.example/bbs')?.socketUrl).toBe(
      'wss://ptt.example/bbs'
    );
  });

  it('normalizes the safe connection URL', () => {
    expect(getSafeConnectionUrl('  wstelnet://localhost:8080/bbs  ')).toBe(
      'wstelnet://localhost:8080/bbs'
    );
  });

  it.each([
    'https://example.com/bbs',
    'wsstelnet://user:pass@example.com/bbs',
    'wsstelnet://example.com/bbs#fragment',
    'wsstelnet://example.com:0/bbs',
    'wsstelnet://example.com:65536/bbs',
    'wsstelnet://example.com/bbs%00',
    'wsstelnet://example.com/has\ncontrol',
    'not a URL'
  ])('rejects unsafe connection destinations: %s', value => {
    expect(parseConnectionUrl(value)).toBeNull();
    expect(getSafeConnectionUrl(value)).toBeNull();
  });
});
