# Project Guidelines

## Architecture
- Entry flow is `src/entry.ts` -> `src/js/main.tsx` -> `App` in `src/js/pttchrome.js`.
- `src/components/` is the React UI layer. Follow the existing React 16.2 + react-bootstrap + recompose patterns used in files like `src/components/ContextMenu/PrefModal.js`.
- `src/js/` is the terminal/session core. Preserve its existing function-constructor, prototype, direct DOM, and jQuery style as seen in `src/js/pttchrome.js` and `src/js/term_view.js`; do not modernize these files opportunistically.
- `src/js/term_ui.js` bridges the terminal core to React row/screen rendering. Keep the DOM ids and mount points from `index.html` (`cmdHandler`, `cmenuReact`, `BBSWindow`, `t`, `cursor`, `reactAlert`) stable unless the task requires coordinated changes.

## Build and Test
- Install dependencies before running scripts.
- Use `npm run build` for a production bundle and `npm run dev` or `npm start` for the Vite dev server.
- There is no `test` or `lint` script in `package.json`.
- The dev server proxies `/bbs` websocket traffic to `https://ws.ptt.cc` and sets a custom websocket `origin`; preserve that behavior when changing connection code.
- If port `8080` is already occupied locally, use `npm run dev -- --port 8081` for smoke tests; keep the default development site pointing at `wstelnet://localhost:8080/bbs` unless the task intentionally changes connection behavior.

## Conventions
- Put user-visible strings through `src/js/i18n.js` and update both locale tables: `src/js/en_US_messages.js` and `src/js/zh_TW_messages.js`.
- Keep formatting changes scoped. `lint-staged` only auto-formats `*.json` and `src/components/**/*.{js,json,css}`, so avoid reformatting legacy `src/js/` files to match component code.
- Preferences live in `src/components/ContextMenu/PrefModal.js` and are applied back into the core through `app.onValuesPrefChange(...)`; update defaults, storage, and consuming behavior together.
- Connection defaults come from `src/js/runtime_env.js`: production uses `wsstelnet://ws.ptt.cc/bbs`, development uses `wstelnet://localhost:8080/bbs`, and query-string site overrides only work when `ALLOW_SITE_IN_QUERY=yes`.