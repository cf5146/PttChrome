---
name: ptt-websocket-proxy
description: 'Connect GitHub Pages or other static browser clients to PTT when direct WebSocket handshakes to wss://ws.ptt.cc/bbs fail with HTTP 403 Forbidden. Use for Origin-header allowlist failures, Cloudflare Worker proxy setup, handshake debugging, and frontend wiring to a PTT WebSocket relay.'
argument-hint: 'Describe the current setup or blocker, e.g. "GitHub Pages gets 403 from wss://ws.ptt.cc/bbs"'
---

# PTT WebSocket Proxy

## Outcome

Establish or validate a working browser-to-PTT connection path by routing traffic through a server-side WebSocket proxy that rewrites the upgrade request for PTT's Origin allowlist.

## When To Use

- Browser code on GitHub Pages, Cloudflare Pages, or another static host receives `403 Forbidden` from `wss://ws.ptt.cc/bbs`.
- Need to explain why CORS headers, `fetch`, or frontend header overrides cannot fix the connection.
- Need to create or debug a Cloudflare Worker relay for PTT.
- Need to reconnect the frontend to a proxy URL and handle the raw Big5/ANSI stream correctly.
- Need to separate transport issues from terminal parsing issues.

## Core Model

- Browser WebSocket connections send an `Origin` header during the HTTP upgrade.
- The browser sets `Origin` automatically from the current page origin.
- Client-side JavaScript cannot change that `Origin`.
- PTT uses an allowlist on the upgrade request and rejects unapproved origins with `403 Forbidden`.
- Therefore a direct browser-to-PTT connection from GitHub Pages is not a frontend bug; it is an architecture mismatch that requires a proxy.

## Procedure

1. Confirm the failure mode.
   - Check whether the failure happens during the WebSocket handshake before any terminal bytes arrive.
   - Treat `403 Forbidden` from `wss://ws.ptt.cc/bbs` as an Origin allowlist problem unless evidence shows otherwise.
   - Distinguish this from DNS, TLS, Worker routing, or upstream availability failures.
2. Rule out impossible fixes.
   - Do not recommend client-side `Origin` overrides, CORS tweaks, service worker rewriting, or custom browser headers from frontend JavaScript.
   - Explain that WebSockets do not follow the same browser control surface as `fetch`.
3. Choose the proxy path.
   - For static hosting, default to Cloudflare Workers because it is serverless and easy to deploy.
   - Keep the browser connecting to the Worker URL, not directly to PTT.
   - Keep the Worker connecting upstream to `https://ws.ptt.cc/bbs` with the upgrade preserved.
4. Implement or audit the Worker.
   - Accept only WebSocket upgrade requests.
   - Clone the request to the PTT endpoint.
   - Rewrite `Origin` to an allowed value such as `https://term.ptt.cc`.
   - Rewrite `Host` to `ws.ptt.cc`.
   - Return `fetch(modifiedRequest)` for the upgrade path.
   - Return a short non-upgrade response for accidental HTTP access.
   - Use the examples in [code-examples.md](./references/code-examples.md).
5. Wire the frontend to the proxy.
   - Point the browser `WebSocket` constructor to `wss://<worker>.workers.dev`.
   - Set `binaryType = 'arraybuffer'`.
   - Decode terminal payloads with Big5 only after the transport is confirmed working.
   - Use the browser example in [code-examples.md](./references/code-examples.md).
6. Verify transport before UI work.
   - Confirm the browser reaches the Worker URL over `wss://`.
   - Confirm the proxy opens the upstream connection without `403`.
   - Confirm `onopen`, `onmessage`, or raw frame traffic occurs.
   - Only after transport works, move on to ANSI/Telnet parsing, terminal rendering, input handling, and session UX.
7. Hand off to next-layer implementation.
   - If bytes arrive but the display is unreadable, the remaining work is terminal emulation rather than network access.
   - Queue the next tasks: Telnet negotiation, ANSI escape parsing, Big5 decoding edge cases, keyboard input, and screen diff rendering.

## Decision Points

- If the client is not a browser, re-check whether a proxy is necessary; non-browser clients may control headers directly.
- If the failure is not `403`, inspect TLS, DNS, Worker routing, or upstream availability before assuming Origin rejection.
- If the Worker deploys but the browser still fails, verify the frontend is connecting to the Worker URL with `wss://` and not falling back to the direct PTT URL.
- If the transport succeeds but text is garbled, stop changing proxy logic and shift to encoding and terminal parsing.
- If the user needs a reusable team workflow, keep the skill PTT-specific; if they need a broader pattern for other restricted WebSocket backends, extract a second generalized skill later.

## Completion Criteria

- The root cause is identified as an Origin allowlist rejection or explicitly ruled out.
- A server-side proxy path is selected and documented.
- The Worker implementation preserves WebSocket upgrade behavior and rewrites the required headers.
- The frontend connects to the proxy URL instead of the direct PTT endpoint.
- Transport success is verified separately from terminal UI correctness.
- Remaining post-transport work is clearly identified.

## References

- [Code examples](./references/code-examples.md)

## Example Prompts

- `/ptt-websocket-proxy GitHub Pages gets 403 when connecting to wss://ws.ptt.cc/bbs`
- `/ptt-websocket-proxy review my Cloudflare Worker for PTT Origin rewriting`
- `/ptt-websocket-proxy adapt my frontend to use a workers.dev proxy instead of a direct PTT socket`
- `/ptt-websocket-proxy explain why CORS is not the fix for this PTT WebSocket failure`
