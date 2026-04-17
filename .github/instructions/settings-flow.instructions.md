---
description: "Use when adding or changing a PttChrome setting, persisted preference, settings modal control, checkbox, select, startup-loaded option, or locale-backed settings text. Covers defaults, save flow, runtime application, and locale updates."
name: "Settings Flow"
applyTo:
  - "src/components/ContextMenu/**/*.js"
  - "src/js/main.tsx"
  - "src/js/pttchrome.js"
  - "src/js/i18n.js"
  - "src/js/*_messages.js"
  - "src/js/easy_reading.js"
  - "src/js/term_buf.js"
  - "src/js/term_view.js"
---

# Settings Flow

- Prefer treating settings work as cross-cutting rather than stopping at one control, locale string, or runtime call site.
- For persisted preferences, keep one default source of truth in `DEFAULT_PREFS` in `src/components/ContextMenu/PrefModal.js`.
- When a setting is user-configurable, keep the flow aligned: controls and persistence in `src/components/ContextMenu/PrefModal.js`, save handling in `src/components/ContextMenu/index.js`, startup loading in `src/js/main.tsx`, and runtime application in `App.prototype.onValuesPrefChange` or `App.prototype.onPrefChange` in `src/js/pttchrome.js`.
- If a setting changes runtime behavior, update the owning consumer such as `src/js/term_view.js`, `src/js/term_buf.js`, or `src/js/easy_reading.js` so the setting has a real effect.
- Route every new user-visible label, helper message, or tooltip through `src/js/i18n.js` and both locale tables in the same change.
- Reuse an existing setting with the same shape as the template when possible: checkbox, numeric field, nested object field, or select.
- Preserve reset behavior and localStorage compatibility unless the request intentionally changes the settings schema.