---
applyTo: "src/js/**/*.js"
---

# src/js Core Guidelines

Read [.github/copilot-instructions.md](../copilot-instructions.md) first; these rules narrow that guidance for work inside `src/js/`.

- Treat `src/js/` as the terminal and session core. Preserve the existing function-constructor, prototype, direct DOM, and jQuery style used in files such as `src/js/pttchrome.js` and `src/js/term_view.js`.
- Keep diffs small and local. Do not opportunistically rewrite legacy files into hooks, classes, TypeScript, or a different module pattern.
- Preserve the DOM and mount-point contract relied on by `index.html`, especially `cmdHandler`, `cmenuReact`, `BBSWindow`, `t`, `cursor`, and `reactAlert`.
- When changing rendering or sizing, trace the flow across `src/js/pttchrome.js`, `src/js/term_view.js`, `src/js/term_buf.js`, and `src/js/term_ui.js` before editing. The React screen and row components are only the presentation layer.
- When changing connection behavior, preserve the defaults and query-string rules defined in `src/js/runtime_env.js`: production defaults to `wsstelnet://ws.ptt.cc/bbs`, development defaults to `wstelnet://localhost:8080/bbs`, and query overrides only work when `ALLOW_SITE_IN_QUERY=yes`.
- Route user-visible strings through `src/js/i18n.js` and update both locale tables in `src/js/en_US_messages.js` and `src/js/zh_TW_messages.js`.
- Follow existing preference plumbing instead of hardcoding values. Defaults live in `src/components/ContextMenu/PrefModal.js`, startup loading happens in `src/js/main.tsx`, and runtime application happens through `App.prototype.onValuesPrefChange` and `App.prototype.onPrefChange` in `src/js/pttchrome.js`.
