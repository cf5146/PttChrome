// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';

import { AnsiParser } from './ansi_parser';
import { TelnetConnection } from './telnet';
import { TermBuf } from './term_buf';
import { Websocket } from './websocket';

class TestWebSocket {
  static latest: TestWebSocket;

  binaryType = '';

  listeners: Record<string, (event: unknown) => void> = {};

  constructor(public url: string) {
    TestWebSocket.latest = this;
  }

  addEventListener(name: string, listener: (event: unknown) => void) {
    this.listeners[name] = listener;
  }

  close = vi.fn();

  send = vi.fn();

  emit(name: string, event: unknown) {
    this.listeners[name]?.(event);
  }
}

describe('terminal transport integration', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('passes fragmented ANSI data through transport, Telnet, parser, and buffer', () => {
    vi.stubGlobal('WebSocket', TestWebSocket);
    const termbuf = new TermBuf(80, 24);
    termbuf.useMouseBrowsing = false;
    termbuf.setView({
      charset: 'UTF-8',
      blinkOn: false,
      update: vi.fn(),
      updateCursorPos: vi.fn()
    });
    const parser = new AnsiParser(termbuf);
    const socket = new Websocket('wss://example.com/bbs');
    const connection = new TelnetConnection(socket);

    connection.addEventListener('data', event => {
      parser.feed(event.detail.data);
    });

    const sendText = (text: string) => {
      const bytes = Uint8Array.from(
        Array.from(text, character => character.codePointAt(0) || 0)
      );
      TestWebSocket.latest.emit('message', { data: bytes.buffer });
    };

    sendText('\x1b[');
    sendText('31mhello');
    sendText('\n<img src=x onerror=alert(1)>');

    expect(termbuf.lines[0].slice(0, 5).map(character => character.ch).join('')).toBe(
      'hello'
    );
    expect(
      termbuf.lines[1]
        .slice(0, 40)
        .map(character => character.ch)
        .join('')
        .trim()
    ).toBe('<img src=x onerror=alert(1)>');
  });
});
