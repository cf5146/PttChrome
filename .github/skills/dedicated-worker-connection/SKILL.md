---
name: dedicated-worker-connection
description: 'Move PttChrome websocket lifecycle and anti-idle timing into a Dedicated Web Worker. Use when background-tab timer throttling drops PTT sessions, when implementing the worker-backed transport under App._setupWebsocketConn, or when validating fallback and worker message-bridge behavior.'
argument-hint: 'Describe the step you need, for example "implement worker-backed transport" or "review anti-idle worker flow"'
---

# Dedicated Worker Connection

## Outcome

Move raw connection management and anti-idle timing off the main thread while keeping PttChrome's existing Telnet parser, terminal rendering, and reconnect UX intact.

## When To Use

- Backgrounded Chromium tabs are dropping the PTT session because main-thread timers are throttled.
- Need to offload websocket lifecycle and anti-idle timing without rewriting `src/js/telnet.js`.
- Need to introduce or review a worker-backed transport adapter under `App.prototype._setupWebsocketConn`.
- Need to preserve the existing reconnect flow and connection alert behavior while changing transport internals.
- Need to document or validate the worker message bridge, fallback path, or transferable payload handling.

## Core Model

- `App.prototype.connect()` in `src/js/pttchrome.js` already resolves `wstelnet://` or `wsstelnet://` into a browser `ws://` or `wss://` URL.
- `App.prototype._setupWebsocketConn()` is the low-blast-radius seam for transport changes.
- `TelnetConnection` in `src/js/telnet.js` is already duck-typed against a socket-like object that emits `open`, `data`, and `close` and implements `send()`.
- `src/js/websocket.js` is the baseline transport contract to preserve.
- The current anti-idle payload is `\x1b\x1b`, and the current preference comes from `antiIdleTime` in `src/store/index.ts` and the Settings modal in `src/components/ContextMenu/PrefModal.js`.
- The worker should own only transport concerns: raw websocket lifecycle, binary payload transfer, anti-idle timing, and cleanup. It should not know about DOM, React, or ANSI parsing.

## Procedure

1. Confirm the seam.
   - Read `src/js/pttchrome.js`, `src/js/websocket.js`, and `src/js/telnet.js`.
   - Verify `_setupWebsocketConn()` is still the only place constructing the raw websocket transport.
2. Preserve the current contract.
   - Keep `TelnetConnection` unchanged in the first pass.
   - Make the new adapter dispatch the same `open`, `data`, `error`, and `close` CustomEvents as `src/js/websocket.js`.
3. Define the worker protocol narrowly.
   - Main thread to worker: `CONNECT`, `SEND`, `SET_ANTI_IDLE_TIME`, `CLOSE`.
   - Worker to main thread: `OPEN`, `DATA`, `ERROR`, `CLOSE`.
4. Keep anti-idle semantics stable.
   - Preserve the current `\x1b\x1b` heartbeat payload.
   - Keep the threshold driven by the existing `antiIdleTime` preference.
   - Move the timing loop into the worker and let the main thread skip `App.prototype.antiIdle()` only when the worker transport is active.
5. Use a legacy-style adapter.
   - Add a `src/js/worker_websocket.js` adapter mixed with `Event.mixin`.
   - Spawn the worker with a Vite-safe module worker path.
   - Convert outbound binary-string payloads to `ArrayBuffer` before `postMessage`.
   - Convert inbound `ArrayBuffer` payloads back into the binary-string format expected by `TelnetConnection`.
6. Integrate carefully.
   - Update `_setupWebsocketConn()` to prefer the worker transport and fall back to `src/js/websocket.js` if worker creation fails.
   - Push anti-idle preference changes from `App.prototype.onPrefChange('antiIdleTime')` into the live transport when supported.
   - Preserve existing connect-state and alert behavior in `onConnect()` and `onClose()`.
7. Validate in increasing cost order.
   - Add a focused adapter test that stubs `Worker` and exercises connect/send/data/close behavior.
   - Run `npm run test` on the narrow test first.
   - Run `npm run typecheck` and `npm run build`.
   - Smoke-test the app and confirm background-tab survival manually.

## Decision Points

- If worker creation fails synchronously, prefer immediate fallback to `src/js/websocket.js` instead of failing the entire connection attempt.
- If you need to preserve existing Telnet and ANSI behavior, do not move parsing into the worker in the first pass.
- If typecheck or build complains about worker imports, prefer the minimal Vite-compatible fix instead of redesigning the transport.
- If background-tab survival is the only target, keep the worker focused on timing and transport, not on UI or parser work.
- If anti-idle behavior needs to change later, treat payload changes and interval semantics as a second pass after the worker transport is stable.

## Completion Criteria

- A worker-backed transport can replace the direct websocket transport under `_setupWebsocketConn()`.
- `TelnetConnection` continues to work without structural changes.
- Anti-idle timing runs in the worker and the main-thread anti-idle loop is skipped only for the worker path.
- Worker startup failure falls back to the existing websocket transport.
- Focused tests, typecheck, and build pass.
- Manual smoke testing confirms connect, reconnect, and background-tab resilience.

## References

- [Code examples](./references/code-examples.md)

## Example Prompts

- `/dedicated-worker-connection implement the worker-backed websocket adapter`
- `/dedicated-worker-connection review the anti-idle timing flow`
- `/dedicated-worker-connection validate the fallback path to src/js/websocket.js`
- `/dedicated-worker-connection document the worker message protocol for PttChrome`
