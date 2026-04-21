---
description: 'Add or change a persisted PttChrome preference end to end across UI, storage, locales, and runtime behavior.'
name: 'add-preference'
agent: 'agent'
argument-hint: 'Describe the preference, default value, UI control, and expected behavior.'
---

# Add Preference

## Mission

Implement a PttChrome preference end to end. Do not stop at adding a checkbox or input field. Carry the change through defaults, storage, startup loading, runtime behavior, and locale strings.

Request:

${input:request:Describe the preference, default value, UI control, and expected behavior.}

## Scope And Preconditions

- Read [.github/copilot-instructions.md](../copilot-instructions.md), [react-ui.instructions.md](../instructions/react-ui.instructions.md), and [src-js-core.instructions.md](../instructions/src-js-core.instructions.md) before editing.
- Use an existing preference with a similar shape as the template for the change: checkbox, numeric input, nested object field, or select.
- Keep the existing React 16.2 plus `recompose` patterns in `src/components/` and the prototype plus direct DOM style in `src/js/`.

## Required Files To Inspect

- `src/components/ContextMenu/PrefModal.js` for `DEFAULT_PREFS`, localStorage persistence, and the settings modal UI.
- `src/components/ContextMenu/index.js` for preference save flow.
- `src/js/main.tsx` for startup loading with `readValuesWithDefault()`.
- `src/js/pttchrome.js` for `App.prototype.onValuesPrefChange` and `App.prototype.onPrefChange`.
- `src/js/i18n.js`, `src/js/en_US_messages.js`, and `src/js/zh_TW_messages.js` for user-visible copy.
- Any owning runtime file that actually uses the preference, such as `src/js/term_view.js`, `src/js/term_buf.js`, or `src/js/easy_reading.js`.

## Workflow

1. Identify one existing preference that is structurally similar and follow its pattern exactly unless the request requires a deliberate deviation.
2. Update `DEFAULT_PREFS` in `src/components/ContextMenu/PrefModal.js`. If the value is nested, keep using the existing dot-path naming and `changeNestedValue` flow.
3. Add or update the UI control in `src/components/ContextMenu/PrefModal.js`. Reuse existing `react-bootstrap` controls and local handlers.
4. Add all required locale keys in both `src/js/en_US_messages.js` and `src/js/zh_TW_messages.js`. If the UI adds helper text or a tooltip, add both translations in the same change.
5. Wire the runtime behavior through `App.prototype.onPrefChange` in `src/js/pttchrome.js`. If the preference needs whole-object handling, also update `App.prototype.onValuesPrefChange`.
6. Update the owning runtime file so the preference has an actual effect. Do not leave the new setting unused.
7. Check whether startup behavior or secondary consumers also need the new value. Existing examples include `src/js/main.tsx` and `src/js/easy_reading.js`.
8. Preserve reset behavior and localStorage compatibility unless the request explicitly changes the storage schema.
9. Validate changed files for errors and summarize any remaining runtime risk.

## Quality Checks

- The preference has one default source of truth in `DEFAULT_PREFS`.
- Saving the modal persists the value and re-applies it without a page reload.
- Reloading the app restores the same value from localStorage.
- Resetting preferences restores the new default.
- Every new user-facing string exists in both locale files.
- The change does not introduce React-only logic into `src/js/` or terminal-core logic into `src/components/`.

## Output Expectations

- Make the necessary file edits.
- Report which files changed and why.
- Call out anything you could not validate, such as a missing local dependency that blocks `npm run build`.