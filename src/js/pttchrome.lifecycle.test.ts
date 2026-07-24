// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { readConnectionState, writeConnectionState } from '../store';
import { App } from './pttchrome';

const createConnection = () => ({
  close: vi.fn(),
  isConnected: true,
  removeEventListener: vi.fn()
});

const createApp = (connection: ReturnType<typeof createConnection>, sessionId = 1) => {
  const app = Object.create(App.prototype);
  Object.assign(app, {
    conn: connection,
    sessionId,
    reconnectAttempt: 0,
    reconnectTimer: null,
    intentionalDisconnect: false,
    timerEverySec: null,
    mbTimer: null,
    _connectionHandlers: null,
    cancelMbTimer: vi.fn(),
    updateTabIcon: vi.fn(),
    connect: vi.fn(),
    parser: { feed: vi.fn() },
    view: { enableNotifications: false },
    appFocused: true,
    idleTime: 0
  });
  return app;
};

describe('App connection lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    writeConnectionState({
      lifecycle: 'connected',
      sessionId: 1,
      connectedUrl: {
        url: 'wstelnet://localhost:8080/bbs',
        site: 'localhost',
        port: 8080
      },
      activeAlert: null
    });
    document.head.innerHTML = '';
  });

  it('ignores events from an inactive session', () => {
    const connection = createConnection();
    const app = createApp(connection, 2);

    app.onData('stale', 1, connection);
    app.onError(1, connection);
    app.onClose(1, connection);

    expect(app.parser.feed).not.toHaveBeenCalled();
    expect(readConnectionState().lifecycle).toBe('connected');
  });

  it('marks an active session failure and raises the connection alert', () => {
    const connection = createConnection();
    const app = createApp(connection);

    app.onError(1, connection);

    expect(readConnectionState()).toEqual(expect.objectContaining({
      lifecycle: 'failed',
      connectState: 2,
      activeAlert: 'connection',
      sessionId: 1
    }));
  });

  it('schedules the first reconnect after a close', () => {
    const connection = createConnection();
    const app = createApp(connection);

    app.onClose(1, connection);

    expect(readConnectionState().lifecycle).toBe('disconnected');
    expect(app.reconnectAttempt).toBe(1);
    expect(app.connect).not.toHaveBeenCalled();

    vi.advanceTimersByTime(3000);

    expect(app.connect).toHaveBeenCalledWith(
      'wstelnet://localhost:8080/bbs',
      { preserveReconnect: true }
    );
  });

  it('does not reconnect after an explicit disconnect', () => {
    const connection = createConnection();
    const app = createApp(connection);

    app.reconnectTimer = {
      cancel: vi.fn()
    };
    app.disconnect();
    vi.runAllTimers();

    expect(connection.close).toHaveBeenCalledTimes(1);
    expect(app.connect).not.toHaveBeenCalled();
    expect(app.intentionalDisconnect).toBe(true);
    expect(readConnectionState().lifecycle).toBe('disconnected');
  });

  it('transitions to failed after bounded retries are exhausted', () => {
    const connection = createConnection();
    const app = createApp(connection);
    app.reconnectAttempt = 3;

    app.onClose(1, connection);

    expect(readConnectionState().lifecycle).toBe('failed');
    expect(app.reconnectTimer).toBeNull();
  });
});
