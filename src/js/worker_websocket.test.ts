// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { WorkerWebsocket } from './worker_websocket';

type EventfulWorkerWebsocket = WorkerWebsocket & {
  addEventListener: (type: string, listener: (event: Event) => void) => void;
};

class FakeWorker {
  static readonly instances: FakeWorker[] = [];

  url: URL;

  options: WorkerOptions;

  messages: Array<{
    message: unknown;
    transferList: Transferable[];
  }> = [];

  terminated = false;

  listeners = {
    error: [],
    message: []
  };

  constructor(url: URL, options: WorkerOptions) {
    this.url = url;
    this.options = options;
    FakeWorker.instances.push(this);
  }

  addEventListener(type: keyof FakeWorker['listeners'], listener: EventListener) {
    this.listeners[type].push(listener);
  }

  removeEventListener(type: keyof FakeWorker['listeners'], listener: EventListener) {
    this.listeners[type] = this.listeners[type].filter(fn => fn !== listener);
  }

  postMessage(message: unknown, transferList: Transferable[] = []) {
    this.messages.push({ message, transferList });
  }

  terminate() {
    this.terminated = true;
  }

  emitMessage(data: unknown) {
    const event = new MessageEvent('message', { data });

    this.listeners.message.forEach(listener => {
      listener.call(this, event);
    });
  }
}

describe('WorkerWebsocket', () => {
  beforeEach(() => {
    FakeWorker.instances.length = 0;
    vi.stubGlobal('Worker', FakeWorker);
  });

  it('connects the worker and forwards anti-idle updates', () => {
    const socket = new WorkerWebsocket('ws://example.test/bbs');
    const worker = FakeWorker.instances[0];

    expect(worker.options).toEqual({ type: 'module' });
    expect(worker.messages[0]).toEqual({
      message: {
        type: 'CONNECT',
        payload: {
          url: 'ws://example.test/bbs'
        }
      },
      transferList: []
    });

    socket.setAntiIdleTime(45000);

    expect(worker.messages[1]).toEqual({
      message: {
        type: 'SET_ANTI_IDLE_TIME',
        payload: {
          milliseconds: 45000
        }
      },
      transferList: []
    });
  });

  it('translates string payloads into transferable buffers and emits data events', () => {
    const socket = new WorkerWebsocket('ws://example.test/bbs') as EventfulWorkerWebsocket;
    const worker = FakeWorker.instances[0];
    const onData = vi.fn();

    socket.addEventListener('data', onData);
    socket.send('\x1bA');

    const sendMessage = worker.messages[1] as {
      message: {
        type: string;
        payload: ArrayBuffer;
      };
      transferList: Transferable[];
    };

    expect(sendMessage.message.type).toBe('SEND');
    expect(Array.from(new Uint8Array(sendMessage.message.payload))).toEqual([27, 65]);
    expect(sendMessage.transferList).toHaveLength(1);

    worker.emitMessage({
      type: 'DATA',
      payload: new Uint8Array([27, 65, 255]).buffer
    });

    expect(onData).toHaveBeenCalledTimes(1);
    const dataEvent = onData.mock.calls[0][0] as CustomEvent;

    expect(dataEvent.detail.data.length).toBe(3);
    expect(dataEvent.detail.data.codePointAt(0)).toBe(27);
    expect(dataEvent.detail.data.codePointAt(1)).toBe(65);
    expect(dataEvent.detail.data.codePointAt(2)).toBe(255);
  });

  it('dispatches close and tears down the worker', () => {
    const socket = new WorkerWebsocket('ws://example.test/bbs') as EventfulWorkerWebsocket;
    const worker = FakeWorker.instances[0];
    const onClose = vi.fn();

    socket.addEventListener('close', onClose);
    socket.close();

    expect(worker.messages[1]).toEqual({
      message: {
        type: 'CLOSE',
        payload: undefined
      },
      transferList: []
    });

    worker.emitMessage({ type: 'CLOSE' });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(worker.terminated).toBe(true);
  });
});
