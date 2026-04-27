# Code Examples

## Worker Message Protocol

Keep the protocol narrow and transport-focused.

```ts
type WorkerCommand =
  | { type: 'CONNECT'; payload: { url: string } }
  | { type: 'SEND'; payload: ArrayBuffer }
  | { type: 'SET_ANTI_IDLE_TIME'; payload: { milliseconds: number } }
  | { type: 'CLOSE' };

type WorkerEvent =
  | { type: 'OPEN' }
  | { type: 'DATA'; payload: ArrayBuffer }
  | { type: 'ERROR'; payload?: string }
  | { type: 'CLOSE' };
```

## Worker Transport Pattern

The worker owns the raw websocket and the anti-idle timer. The first pass keeps the existing `\x1b\x1b` anti-idle payload so App, Telnet, and server behavior stay aligned.

```ts
const ANTI_IDLE_INTERVAL_MS = 1000;
const ANTI_IDLE_PAYLOAD = new Uint8Array([0x1b, 0x1b]);

let socket: WebSocket | null = null;
let antiIdleTime = 0;
let idleTime = 0;

self.onmessage = event => {
  switch (event.data.type) {
    case 'CONNECT':
      socket = new WebSocket(event.data.payload.url);
      socket.binaryType = 'arraybuffer';
      break;
    case 'SEND':
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(event.data.payload);
      }
      break;
    case 'SET_ANTI_IDLE_TIME':
      antiIdleTime = event.data.payload.milliseconds;
      break;
    case 'CLOSE':
      socket?.close();
      break;
  }
};
```

## Legacy-Style Adapter Pattern

The main thread stays compatible with `TelnetConnection` by presenting the same event-driven API as `src/js/websocket.js`.

```javascript
import { Event } from './event';

export function WorkerWebsocket(url) {
  this.handlesAntiIdle = true;
  this._worker = new Worker(
    new URL('../workers/connection.worker.ts', import.meta.url),
    { type: 'module' }
  );

  this._worker.addEventListener('message', this._handleWorkerMessage.bind(this));
  this._worker.postMessage({ type: 'CONNECT', payload: { url } });
}

Event.mixin(WorkerWebsocket.prototype);

WorkerWebsocket.prototype.send = function(str) {
  const bytes = new Uint8Array(str.length);

  for (let i = 0; i < str.length; i++) {
    bytes[i] = str.codePointAt(i);
  }

  this._worker.postMessage(
    { type: 'SEND', payload: bytes.buffer },
    [bytes.buffer]
  );
};

WorkerWebsocket.prototype.setAntiIdleTime = function(milliseconds) {
  this._worker.postMessage({
    type: 'SET_ANTI_IDLE_TIME',
    payload: { milliseconds }
  });
};
```

## App Integration Point

Keep the transport swap local to `_setupWebsocketConn()` and preserve fallback.

```javascript
App.prototype._setupWebsocketConn = function(url) {
  let wsConn;

  try {
    wsConn = new WorkerWebsocket(url);
  } catch (error) {
    console.warn('WorkerWebsocket failed, falling back to Websocket:', error);
    wsConn = new Websocket(url);
  }

  this._attachConn(new TelnetConnection(wsConn));
};
```

## Main-Thread Anti-Idle Guard

Only the legacy websocket path should keep using `App.prototype.antiIdle()`.

```javascript
this.timerEverySec = setTimer(true, () => {
  if (!this.conn?.socket?.handlesAntiIdle) {
    this.antiIdle();
  }

  this.view.onBlink();
  this.incrementCountToUpdatePushthread();
}, 1000);
```

## Validation Order

Use this order to keep the rollout tight:

1. Focused adapter test with a fake `Worker`
2. `npm run typecheck`
3. `npm run build`
4. `npm run dev` smoke test
5. Manual background-tab resilience check
