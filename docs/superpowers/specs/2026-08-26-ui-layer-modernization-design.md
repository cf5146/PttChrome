# Spec: UI Layer Modernization (`src/components/`)

## Summary

Modernize all remaining legacy JavaScript components in `src/components/` to TypeScript (`.tsx`), adopt native `react-bootstrap` components (v2.10.x / Bootstrap 5), and eliminate the legacy `bootstrap-compat.js` shim.

## Goals

1. Convert all 10 legacy `.js` files in `src/components/` to strictly-typed `.tsx` / `.ts` files.
2. Remove `src/components/bootstrap-compat.js` completely and replace with direct `react-bootstrap` imports.
3. Preserve all existing UI behaviors, modal logic, keyboard accessibility, safe external link opening, and Zustand store interactions.
4. Ensure full type-safety (`yarn typecheck`), unit test passing (`yarn test`), and production build completion (`yarn build`).

## Scope & Changes

### 1. Alert Components (`src/components/`)

- **`AppAlertHost.tsx`** (replaces `AppAlertHost.js`):
  - Interface `AppAlertAppTarget` specifying required methods (`reconnect(): void`, `setInputAreaFocus(): void`).
  - Native `react-bootstrap` `Modal` rendering for `pasteShortcut`.
  - Connects to Zustand store `useAppRuntimeStore`.
- **`ConnectionAlert.tsx`** (replaces `ConnectionAlert.js`):
  - Interface `ConnectionAlertProps { onDismiss: () => void }`.
  - Uses native `<Alert variant="danger">` and `<Button variant="danger">`.
  - Retains global `keydown` listener (Enter to reconnect).
- **`DeveloperModeAlert.tsx`** (replaces `DeveloperModeAlert.js`):
  - Interface `DeveloperModeAlertProps { onDismiss: () => void }`.
  - Uses native `<Alert variant="danger">` and `<Button variant="danger">`.
- **`PasteShortcutAlert.tsx`** (replaces `PasteShortcutAlert.js`):
  - Interface `PasteShortcutAlertProps { onDismiss: () => void }`.
  - Uses native `<Alert variant="info">` and `<Button variant="primary">`.

### 2. Context Menu & Modals (`src/components/ContextMenu/`)

- **`index.tsx`** (replaces `index.js`):
  - Define `PttChromeTarget` interface for `pttchrome` instance (copy, paste, navigation, input focus methods).
  - Strongly typed handlers for hotkeys and menu action map.
- **`DropdownMenu.tsx`** (replaces `DropdownMenu.js`):
  - Define props interface for position coordinates and display state flags.
  - Accessible menu attributes (`role="menu"`, `role="menuitem"`).
- **`LiveHelperModal.tsx`** (replaces `LiveHelperModal.js`):
  - Define props interface `{ show: boolean; onHide: () => void; enabled: boolean; sec: number; onChange: (next: { enabled: boolean; sec: number }) => void }`.
  - Direct `react-bootstrap` `Modal`, `OverlayTrigger`, `Tooltip`, `Button`.
- **`InputHelperModal.tsx`** (replaces `InputHelperModal.js`):
  - Define props interface `{ show: boolean; onHide: () => void; onInsertSymbol?: (symbol: string) => void }`.
  - Direct `react-bootstrap` `Modal`, `Tab`, `Nav`, `Row`, `Col`, `Button`, `Form.Check`.
- **`PrefModal.tsx`** (replaces `PrefModal.js`):
  - Typed form state backed by `PreferenceValues` from `src/types/preferences.ts`.
  - Replaces legacy forms with `Form.Group`, `Form.Label`, `Form.Control`, `Form.Select`, `Form.Check`.
  - Preserves `replaceI18n` link token replacements and `getSafeExternalUrl` sanitization.

### 3. Shim Removal

- Delete `src/components/bootstrap-compat.js`.
- Confirm 0 occurrences of `bootstrap-compat` across the codebase.

## Verification & Testing

1. **Typecheck**: `yarn typecheck` (`tsc --noEmit`) passes with zero errors.
2. **Unit Tests**:
   - Add/maintain unit tests for converted components (e.g., `src/components/AppAlertHost.test.tsx`).
   - Run `yarn test` (`vitest run`).
3. **Build**: `yarn build` passes without bundle warnings or errors.
4. **Dev Server**: `yarn dev` boots and React roots mount successfully.


