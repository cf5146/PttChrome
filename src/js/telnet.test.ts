import { describe, expect, it, vi } from 'vitest';

import { TelnetConnection } from './telnet';
import type { TerminalSocket } from '../types/connection';

describe('TelnetConnection lifecycle events', () => {
  it('forwards socket errors and delegates close', () => {
    const listeners: Record<string, (event: unknown) => void> = {};
    const socket = {
      addEventListener(name: string, listener: (event: unknown) => void) {
        listeners[name] = listener;
      },
      send: vi.fn(),
      close: vi.fn()
    } as unknown as TerminalSocket;
    const connection = new TelnetConnection(socket);
    const onError = vi.fn();

    connection.addEventListener('error', onError);
    listeners.error(new Event('error'));

    expect(onError).toHaveBeenCalledTimes(1);

    connection.close?.();
    expect(socket.close).toHaveBeenCalledTimes(1);
  });
});