---
applyTo: "src/components/**/*.js,src/components/**/*.css"
---

# React UI Guidelines

Read [.github/copilot-instructions.md](../copilot-instructions.md) first; these rules narrow that guidance for work inside `src/components/`.

- Follow the existing React 16.2 style built around `react-bootstrap` and `recompose`. Prefer the patterns already used in `src/components/ContextMenu/PrefModal.js`, `src/components/ContextMenu/index.js`, and the row builders instead of introducing hooks or a new state library.
- Keep terminal behavior in `src/js/`. Components should present data, collect input, and call back into the core rather than re-implementing session or rendering logic.
- Preserve existing prop names and mount assumptions shared with `src/js/term_ui.js`, `src/js/pttchrome.js`, and `index.html`.
- Put user-facing copy through `src/js/i18n.js` and update both locale files in `src/js/en_US_messages.js` and `src/js/zh_TW_messages.js`.
- Match the current component and CSS naming style. Reuse existing `PrefModal__...`, `DropdownMenu__...`, and row-segment conventions instead of inventing a parallel naming scheme.
- Keep formatting changes scoped. `lint-staged` auto-formats `src/components/**/*.{js,json,css}` on commit, so avoid unrelated churn in nearby legacy files under `src/js/`.
- When changing preferences UI, update the full flow together: defaults and controls in `src/components/ContextMenu/PrefModal.js`, save handling in `src/components/ContextMenu/index.js`, startup loading in `src/js/main.tsx`, and consuming behavior in `src/js/pttchrome.js` plus any owning runtime file.
