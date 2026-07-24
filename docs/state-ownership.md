# PttChrome State Ownership

## Status

This is the Phase 0 ownership baseline for the `dev` branch. A state value should have one authoritative owner. Other layers may receive a derived value or invoke an explicit adapter, but they must not become a second source of truth.

## Ownership Map

| State category | Authoritative owner | Allowed consumers | Persistence |
| --- | --- | --- | --- |
| Terminal contents and cursor | `TermBuf` in the terminal core | `TermView`, parser, React screen bridge | In memory only |
| Parser and decoder state | Parser/decoder instance for the active connection session | Connection and terminal core | In memory only; reset per session |
| Connection lifecycle | Connection/session layer plus `useAppRuntimeStore` projection | Alerts, connection controls, terminal core | Runtime only |
| Session identity | Connection/session layer | Every socket, Telnet, timer, and async callback | In memory only |
| User preferences | `usePreferencesStore` in `src/store/index.ts` | `PrefModal`, `App.onValuesPrefChange`, preference subscribers | Versioned non-sensitive local storage |
| Context menu and modal visibility | `useContextMenuStore` or local React state | Context menu and modal components | Runtime only |
| Preview target, loading, success, and error | Preview component/request lifecycle | Row link components and preview DOM | Runtime only |
| Transient input and selection | Input element, terminal core, or owning component for the active interaction | Input helpers and event handlers | Runtime only |
| Credentials | No PttChrome owner; terminal session only | PTT login prompt | Never persisted by PttChrome |
| DOM nodes and element references | The owning view/component or legacy DOM adapter | Local event handlers and teardown code | Never stored in Zustand |

## Invariants

1. `TermBuf` is the only authority for terminal text, attributes, cursor position, and terminal dimensions.
2. React components render terminal state but do not mutate the terminal buffer directly.
3. `useAppRuntimeStore` exposes connection state as a runtime projection; it does not own sockets, Telnet adapters, timers, or DOM nodes.
4. Every asynchronous connection callback is associated with the session identifier that created it.
5. A callback from an inactive session cannot mutate the current buffer, view, store projection, alert, or reconnect state.
6. Preferences enter the runtime through the existing preference subscription and `App.onValuesPrefChange` path. Components do not reach into the legacy core to apply individual settings.
7. Persisted preferences are treated as untrusted input and are normalized before they become live state.
8. Preview requests own their lifecycle. A stale preview request may resolve or reject, but it cannot update the current preview target.
9. Zustand stores contain serializable application state and actions only. They do not contain live DOM nodes, sockets, timers, promises, or credentials.
10. Terminal contents and credentials never enter local storage, synchronized storage, analytics, logs, or error messages.
11. Explicit disconnect cancels reconnect work and prevents a closed session from starting a new one.
12. Session reset clears parser, decoder, connection, preview, and terminal-core state that is specific to the previous session.

## Current Integration Points

- Bootstrap: `src/js/main.tsx` creates `App` and selects the configured destination.
- Connection lifecycle: `src/js/pttchrome.js` owns `App`, `conn`, `buf`, `view`, timers, and legacy event wiring.
- Transport adapters: `src/js/websocket.ts` and `src/js/telnet.ts` translate browser socket events and Telnet data.
- Runtime projection: `useAppRuntimeStore` in `src/store/index.ts` exposes `connectState`, `connectedUrl`, and `activeAlert`.
- Preference projection: `usePreferencesStore` persists values and notifies `App` through `subscribePreferenceValues()`.
- Rendering bridge: `src/js/term_ui.js` passes terminal rows and screens to React components.
- Preview lifecycle: `src/components/ImagePreviewer.*` owns resolution, image measurement, and render state.
- Stable DOM contract: `cmdHandler`, `cmenuReact`, `BBSWindow`, `t`, `cursor`, and `reactAlert` remain stable.

## Required Transition Direction

The current code uses numeric connection states and legacy object fields. Future connection changes should move toward an explicit state model while keeping a narrow compatibility mapping for the legacy core:

```text
idle -> connecting -> connected
connecting -> failed
connecting -> disconnected
connected -> disconnecting -> disconnected
connected -> failed -> disconnected
failed -> connecting
```

The session identifier is created when entering `connecting`. It remains fixed for that connection attempt and is replaced for the next attempt. `onConnect`, `onData`, `onError`, `onClose`, timers, and reconnect callbacks must capture and check it.

## Forbidden Ownership Patterns

- A React row mutating `TermBuf.lines` or cursor state.
- A Zustand store holding an `HTMLAnchorElement`, `WebSocket`, timer handle, Promise, or image object.
- A connection callback writing to the store without checking session identity.
- A persisted preference object merged directly into live state without validation.
- A preview resolver deciding application connection destinations.
- A query-string value or BBS-derived URL selecting a worker, proxy, or browser execution path.
- A credential or terminal buffer copied into a persisted preference, debug message, or analytics payload.

## Phase 0 Exit Criteria

- Every planned state category has one named owner.
- Runtime projections and adapters are identified without moving ownership prematurely.
- Session identity is a required design constraint for later connection work.
- Persistence, DOM, credential, and terminal-buffer boundaries are explicit.
