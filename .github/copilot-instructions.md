# Copilot instructions for PttChrome

## What this repo is
- Browser-based PTT terminal client (web): **WebSocket → Telnet → ANSI parser → terminal buffer → React/DOM renderer**.

## Architecture & “follow the bytes” map
- Boot + resource loading: `src/entry.js` → `src/js/main.js`.
  - Loads Big5↔Unicode tables into `window.lib.{b2uArray,u2bArray}` from `src/conv/{b2u_table.bin,u2b_table.bin}`.
  - Creates `new App()` and applies prefs via `app.onValuesPrefChange(readValuesWithDefault())`.
- Connection + protocol stack:
  - `src/js/pttchrome.js` (`App`) builds the pipeline and owns UI glue/events.
  - `src/js/websocket.js` wraps `WebSocket` and emits `open|data|close`.
  - `src/js/telnet.js` (`TelnetConnection`) handles RFC854 negotiation + NAWS, and converts outgoing text with `u2b()`.
  - `src/js/ansi_parser.js` parses escape sequences and mutates `TermBuf`.
- Screen model → view:
  - `src/js/term_buf.js` (`TermBuf`) is the screen state + URL detection + update scheduling.
  - `src/js/term_view.js` (`TermView`) maps buffer updates to React rendering.
  - `src/js/term_ui.js` calls `ReactDOM.render(<Screen .../>)`; `src/components/Screen.js` owns `#mainContainer`.

## Runtime conventions (don’t break these)
- `src/dev.html` must contain IDs: `cmdHandler`, `cmenuReact`, `BBSWindow`, `t` (hidden input), `cursor`, `reactAlert`.
- Many modules rely on **global** `React`, `ReactDOM`, and `$` (jQuery) provided via CDN wiring in `webpack.config.js` (`WebpackCdnPlugin`). Don’t “fix imports” unless you also change the bundling strategy.
- Connection URL scheme is custom: `wstelnet://host/path` → `ws://…`, `wsstelnet://…` → `wss://…` (see `App.prototype.connect`).
- Preferences are stored at `localStorage["pttchrome.pref.v1"]` (see `src/components/ContextMenu/PrefModal.js`).

## Dev/build workflow (authoritative)
- `npm start`: webpack-dev-server; proxies `/bbs` → `https://ws.ptt.cc` and overrides WS `Origin` to `https://term.ptt.cc`.
- `npm run build`: emits `dist/index.html` and hashed assets under `dist/assets/`.
- Build-time flags come from `webpack.config.js` `DefinePlugin` (`process.env.DEFAULT_SITE`, `process.env.DEVELOPER_MODE`, `process.env.ALLOW_SITE_IN_QUERY`).

## Repo-specific editing tips
- Webpack is configured for `test: /\.js$/` (not `.jsx`). Keep runtime JS in `.js` unless you update config.
- Pre-commit formatting runs Prettier for `*.json` and `src/components/**/*.{js,json,css}` (see `lint-staged` in `package.json`).
