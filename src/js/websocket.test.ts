import { describe, expect, it, vi } from 'vitest';

import { RESOURCE_LIMITS } from './resource_limits';
import { Websocket } from './websocket';

class FakeWebSocket {
  binaryType = '';

  close = vi.fn();

  listeners: Record<string, (event: unknown) => void> = {};

  constructor(public url: string) {}

  addEventListener(name: string, listener: (event: unknown) => void) {
    this.listeners[name] = listener;
  }

  send = vi.fn();
}

describe('Websocket resource limits', () => {
  it('dispatches accepted messages as text', () => {
    vi.stubGlobal('WebSocket', FakeWebSocket);
    const socket = new Websocket('wss://example.com/bbs');
    const data = vi.fn();
    socket.addEventListener('data', data);

    socket._conn.listeners.message({
      data: Uint8Array.from([65, 66, 67]).buffer
    });

    expect(data).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'data',
        detail: { data: 'ABC' }
      })
    );
  });

  it('rejects oversized messages and closes the socket', () => {
    vi.stubGlobal('WebSocket', FakeWebSocket);
    const socket = new Websocket('wss://example.com/bbs');
    const error = vi.fn();
    socket.addEventListener('error', error);
    const payload = new Uint8Array(RESOURCE_LIMITS.maxConnectionMessageBytes + 1);

    socket._conn.listeners.message({ data: payload.buffer });

    expect(error).toHaveBeenCalledTimes(1);
    expect(socket._conn.close).toHaveBeenCalledWith(1009, 'Message too large');
  });
});