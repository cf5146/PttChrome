# PttChrome

A web-based terminal BBS client for [PTT](https://www.ptt.cc), Taiwan's largest bulletin board system. PttChrome runs entirely in the browser, connecting to PTT over WebSocket and rendering the ANSI terminal interface as HTML.

## Features

- **Full terminal emulation** — 80×24 ANSI/BBS terminal with accurate color rendering
- **Image preview** — Inline and hover image previews for URLs in BBS posts
- **Input helper** — Modal assistance for composing text with special characters
- **Easy-reading mode** — Enhanced readability for long posts
- **Right-click context menu** — Quick access to common actions
- **User preferences** — Persistent settings for mouse browsing, highlight colors, and more
- **Touch support** — Mobile and tablet-friendly interaction
- **Internationalization** — English and Traditional Chinese (繁體中文) UI

## Tech Stack

| Layer | Technology |
| ----- | ---------- |
| UI | React 19, react-bootstrap 2, Bootstrap 5 |
| State | Zustand 5 |
| Terminal core | Vanilla JS, jQuery 4, direct DOM |
| Build | Vite 8, TypeScript 6 |
| Testing | Vitest 4 |
| Connection | WebSocket + Telnet over `wsstelnet://` / `wstelnet://` |

## Getting Started

**Prerequisites:** Node.js 18+ and [Yarn 4](https://yarnpkg.com/getting-started/install).

```bash
# Install dependencies
yarn install

# Start the development server (http://localhost:8080)
yarn dev

# If port 8080 is already in use
yarn dev --port 8081

# Run unit tests
yarn test

# Type-check without emitting
yarn typecheck

# Run source-safety lint and dependency checks
yarn lint
yarn security:scan

# Production build → dist/
yarn build

# Preview the production build locally
yarn preview
```

> **Dev proxy:** PTT's WebSocket endpoint (`wss://ws.ptt.cc/bbs`) enforces an Origin allowlist and rejects browser connections from unapproved origins with `403 Forbidden`. Because browsers set `Origin` automatically and JavaScript cannot override it, a server-side proxy that rewrites the header is required. The dev server forwards `/bbs` traffic to a Cloudflare Workers relay, so no local PTT server is needed during development. See the [ptt-websocket-proxy skill](.github/skills/ptt-websocket-proxy/SKILL.md) for the full architecture.

The local Vite WebSocket proxy keeps certificate verification enabled and combines Node's bundled roots with the host system CA store. This allows development behind enterprise TLS inspection without setting `NODE_TLS_REJECT_UNAUTHORIZED=0`.

## Configuration

Set the following environment variables (e.g. in a `.env.local` file) before building:

| Variable | Default | Description |
| --- | --- | --- |
| `PTTCHROME_PAGE_TITLE` | `PttChrome` | Browser tab title |
| `ALLOW_SITE_IN_QUERY` | *(unset)* | Set to `yes` to allow overriding the BBS address via the `?site=` query parameter |

Standard Vite variables prefixed with `VITE_` are also exposed to the client bundle.

## Security and Privacy

PttChrome treats all BBS output as untrusted input. Terminal text is rendered as text and external links and image-preview URLs are validated before use.

PttChrome does not implement autologin and does not persist usernames, passwords, terminal buffers, or session credentials. Credentials are entered in the PTT terminal session and should not be placed in URLs, logs, screenshots, issue reports, or browser storage.

Image previews make requests to external image hosts. Those requests can disclose network metadata to the image host, even though previews use an intentional `no-referrer` policy. Disable image previews when that disclosure is not acceptable. See [SECURITY.md](SECURITY.md) for private vulnerability reporting and credential-exposure guidance.

The browser client uses a WebSocket relay because browsers cannot override the WebSocket `Origin` header. The Telnet-compatible transport is not equivalent to end-to-end encrypted SSH; users should not assume that the relay or transport provides SSH-level confidentiality.

## Deployment

### GitHub Pages

The build output uses a relative base path (`./`), so it works correctly when served from any subdirectory on GitHub Pages. Run `yarn build` and deploy the `dist/` folder.

### WebSocket Proxy

PTT's WebSocket endpoint (`wss://ws.ptt.cc/bbs`) blocks browser connections that do not originate from an allowed origin. PttChrome uses a Cloudflare Workers relay at `ptt-proxy.cf5146.workers.dev` as the default production endpoint.

To self-host the proxy, see the [ptt-websocket-proxy skill](.github/skills/ptt-websocket-proxy/SKILL.md).

## Browser and Release Support

Use a current browser with WebSocket, ES2020 JavaScript, CSS, and standard Web APIs. The project does not promise support for obsolete browsers or browser extensions that rewrite scripts, styles, or WebSocket traffic.

The `dev` branch is active development. Pull requests run CI but do not deploy GitHub Pages. Pages deployment follows the repository's workflow owner and default-branch conditions. Tagged releases should document the exact commit, supported browser behavior, WebSocket relay and Telnet limitations, third-party image-preview privacy, and the fact that credentials are never persisted by PttChrome.

See [docs/release-checklist.md](docs/release-checklist.md) before creating a release tag.

## Architecture

```text
src/entry.ts
  └─ src/js/main.tsx          # i18n setup, resource loading, app bootstrap
       └─ App (src/js/pttchrome.js)   # Terminal emulator core (class-based, jQuery)
            └─ src/js/term_ui.js      # Bridge: terminal core ↔ React rendering
                 └─ src/components/   # React UI layer
                      ├─ Screen.tsx
                      ├─ Row/          # Per-row ANSI rendering with link detection
                      ├─ ImagePreviewer.*
                      └─ ContextMenu/  # Right-click menu, preferences modal
```

**Two-layer design:**

- `src/js/` — Legacy terminal core. Preserved in its original function-constructor / prototype / jQuery style. Do not opportunistically modernize these files.
- `src/components/` — React UI layer. Follows modern React patterns. New UI features go here.

## Localization

User-visible strings live in `src/js/i18n.js` and must be added to **both** locale tables:

- `src/js/en_US_messages.js`
- `src/js/zh_TW_messages.js`

## License

[GNU General Public License v3.0](LICENSE)
