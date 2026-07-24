# PttChrome Threat Model

## Status

This is the Phase 0 baseline for the `dev` branch. It records the security assumptions and decisions that govern the later security gate, connection hardening, parser limits, and release work.

Baseline captured on 2026-07-24:

- `corepack yarn typecheck`: passed.
- `corepack yarn test`: passed, 4 files and 24 tests.
- `corepack yarn build`: passed.
- Existing build warnings: Vite reports that `transformWithEsbuild` and `optimizeDeps.esbuildOptions` are deprecated.

## System Scope

PttChrome is a browser application that connects to PTT through a WebSocket relay and renders terminal data as HTML. The in-scope system includes:

- The static browser bundle and GitHub Pages hosting.
- The legacy terminal core under `src/js/`.
- The React rendering layer under `src/components/`.
- Browser local storage used for non-sensitive preferences.
- The WebSocket and Telnet adapter stack.
- The Cloudflare Worker WebSocket relay used by deployed and development builds.
- External URLs and images discovered in BBS content.

The PTT service and the relay implementation are dependencies and trust boundaries, not code owned by this repository.

## Assets

- Terminal text, ANSI attributes, cursor state, and rendered screen contents.
- User preferences, including display and interaction settings.
- Connection destination and transport configuration.
- Browser execution context, DOM, and application JavaScript.
- User-entered credentials and session authentication material.
- Provider URLs, image requests, and external navigation targets.
- Build inputs, deployment credentials, GitHub Actions workflow integrity, and release artifacts.

## Trust Boundaries

1. **BBS to browser:** All terminal bytes and decoded text received from PTT are untrusted. They may contain HTML-like text, malformed control sequences, URLs, or values intended to influence browser behavior.
2. **Terminal buffer to DOM:** Terminal-derived values cross from the legacy buffer and renderer bridge into React props, text nodes, attributes, and preview requests. No terminal value may enter an HTML parsing sink.
3. **BBS URL to external network:** A URL extracted from terminal text is untrusted. It must pass the shared URL policy before navigation or image loading.
4. **Provider rewrite to image DOM:** A resolver-generated URL is untrusted until it is independently validated after rewriting. A valid original URL does not make resolver output trusted.
5. **Browser to WebSocket relay:** The browser cannot control the WebSocket `Origin` header. The configured relay is an explicit deployment dependency and must not be selected by remote BBS content.
6. **Query string and build environment to connection setup:** Query overrides are disabled unless `ALLOW_SITE_IN_QUERY=yes`. Defaults and enabled overrides must pass the same destination policy.
7. **Browser storage to runtime state:** Persisted preferences are untrusted input. They must be parsed, schema-validated, migrated by version, and defaulted safely before entering live state.
8. **GitHub Actions to deployment:** Pull-request content is untrusted and must not receive deployment permissions or influence a production Pages deployment.

## Security Decisions

### Terminal rendering

- Render terminal-derived content with text nodes or normal React interpolation.
- Map ANSI formatting only to predefined internal classes and styles.
- Keep HTML parsing restricted to fixed, audited application markup.
- Add regression coverage for HTML-like text, event-handler attributes, malformed URLs, and control sequences.

### External URLs and previews

- Use the standard `URL` API behind one shared validation policy.
- Allow only explicitly approved protocols for navigation.
- Require validated `https:` output for image previews unless a provider exception is documented and tested.
- Reject credentials, malformed hosts or ports, unsupported schemes, protocol-relative input, and partly sanitized output.
- Validate both the original URL and every provider-rewritten URL.
- Keep displayed terminal text separate from the navigation or image URL.
- Open external pages with `noopener` and `noreferrer`.
- Do not ship browser-bundled provider secrets. Flickr support requires a separately reviewed server-side contract or removal.
- Preview requests must be bounded and stale work must not update the current preview.

### Credentials

- PttChrome does not implement autologin.
- Credentials are entered into the terminal session and are not stored by PttChrome.
- Credentials must not be placed in preferences, URLs, logs, analytics, error messages, devtools state, or worker debug messages.
- This roadmap does not add credential persistence or a credential-management UI.

### Connection destinations

- Production defaults to `wsstelnet://ptt-proxy.cf5146.workers.dev/bbs`.
- Development defaults to `wstelnet://localhost:8080/bbs`.
- Query-string site overrides remain opt-in and must pass explicit scheme, host, port, path, credential, and fragment validation.
- Remote terminal content and worker messages cannot choose a destination.
- No persisted proxy destination setting is added in this roadmap.
- Deployed connections should prefer secure WebSocket transport.

### Transport limitations

- Telnet-compatible transport is not equivalent to end-to-end encrypted SSH.
- The relay is a required security and availability dependency for browser connections to PTT.
- The application must document transport limitations rather than imply that browser-side rendering provides transport confidentiality.

### Content Security Policy

- CSP must be derived from the actual production bundle and runtime requirements.
- Avoid `unsafe-eval` and minimize `unsafe-inline`.
- The policy must explicitly account for scripts, styles, fonts, workers, WebSockets, images, and any provider origins.
- GitHub Pages hosting limitations for response headers versus meta-delivered policy must be documented.

## Threats and Controls

| Threat | Control | Verification |
| --- | --- | --- |
| BBS text becomes executable HTML or script | Text rendering, fixed ANSI class mapping, sink audit | DOM regression tests and source scan |
| Malicious URL navigates to a dangerous scheme | Shared URL policy and render-time validation | Adversarial URL tests |
| Resolver output bypasses original URL validation | Validate resolver output after every rewrite | Image preview resolver tests |
| Provider key is abused from the public bundle | Remove client-bundled secret or use server-side contract | Bundle secret scan |
| Stale image or socket event mutates current state | Request cancellation/invalidation and session identity | Delayed-event tests |
| Query string redirects the client to an unsafe server | Opt-in query override plus destination validator | Bootstrap destination tests |
| Corrupt local storage injects runtime state | Versioned envelope, field validation, safe migration | Store migration tests |
| Unbounded input exhausts CPU or memory | Centralized limits at transport, parser, buffer, and preview boundaries | Limit and property tests |
| Pull request content deploys or receives secrets | Read-only CI permissions and protected Pages environment | Workflow review and CI event tests |
| Users assume credentials or transport are protected | Explicit README and security documentation | Release checklist review |

## Out of Scope

- A new server or WebSocket proxy implementation in this repository.
- Autologin or persistent credential storage.
- Terminal-buffer persistence or replay of terminal input.
- A full JavaScript-to-TypeScript rewrite.
- Changing the current GitHub Pages deployment model.
- Unrelated UI redesign.

## Phase 0 Exit Criteria

- The baseline commands and their outcomes are recorded above.
- Terminal content, external URLs, browser storage, connection destinations, credentials, and deployment are each assigned an explicit trust boundary.
- Security decisions and non-goals are documented before runtime changes begin.
- Later phases can point to this document when choosing validation, storage, transport, and release behavior.
