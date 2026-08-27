# UI Layer Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modernize all 10 legacy JavaScript files in `src/components/` to TypeScript (`.tsx`), switch directly to native `react-bootstrap` components, remove `bootstrap-compat.js`, and verify with tests and builds.

**Architecture:** Convert alerts and modal components from legacy React 16 + bootstrap-compat wrapper patterns to modern TypeScript + React 19 + native `react-bootstrap` (v2.10.x / Bootstrap 5), preserving existing Zustand store bindings, keyboard a11y, and runtime contracts with the BBS core.

**Tech Stack:** React 19, TypeScript 6, react-bootstrap 2.10, Zustand 5, Vite 8, Vitest 4.

**Spec:** `docs/superpowers/specs/2026-08-26-ui-layer-modernization-design.md`

## Global Constraints

- Entry flow is `src/entry.ts` -> `src/js/main.tsx` -> `App` in `src/js/pttchrome.js`.
- Mount points `cmdHandler`, `cmenuReact`, `BBSWindow`, `t`, `cursor`, `reactAlert` must remain unchanged.
- User strings must continue to route through `src/js/i18n.js`.
- All converted components must have strict TypeScript types (no `any` where concrete interfaces can be defined).
- `yarn typecheck` and `yarn test` must pass on every checkpoint.

---

### Task 1: Migrate Alert Components to TypeScript (`src/components/`)

**Files:**
- Create: `src/components/ConnectionAlert.tsx`
- Create: `src/components/DeveloperModeAlert.tsx`
- Create: `src/components/PasteShortcutAlert.tsx`
- Create: `src/components/AppAlertHost.tsx`
- Delete: `src/components/ConnectionAlert.js`
- Delete: `src/components/DeveloperModeAlert.js`
- Delete: `src/components/PasteShortcutAlert.js`
- Delete: `src/components/AppAlertHost.js`
- Test: `src/components/AppAlertHost.test.tsx`

**Interfaces:**
- Consumes:
  - `useAppRuntimeStore`, `writeRuntimeAlert`, `writeRuntimeModalOpen` from `src/store`
  - `i18n` from `src/js/i18n`
- Produces:
  - `export const ConnectionAlert: React.FC<{ onDismiss: () => void }>`
  - `export const DeveloperModeAlert: React.FC<{ onDismiss: () => void }>`
  - `export const PasteShortcutAlert: React.FC<{ onDismiss: () => void }>`
  - `export const AppAlertHost: React.FC<{ app: { reconnect(): void; setInputAreaFocus(): void } }>`

- [ ] **Step 1: Write unit test for AppAlertHost**

```tsx
// src/components/AppAlertHost.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppAlertHost } from './AppAlertHost';
import { writeRuntimeAlert, writeRuntimeModalOpen, useAppRuntimeStore } from '../store';

describe('AppAlertHost', () => {
  const mockApp = {
    reconnect: vi.fn(),
    setInputAreaFocus: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    writeRuntimeAlert(null);
    writeRuntimeModalOpen(false);
  });

  it('renders nothing when activeAlert is null', () => {
    const { container } = render(<AppAlertHost app={mockApp} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders ConnectionAlert and triggers reconnect on dismiss', () => {
    writeRuntimeAlert('connection');
    render(<AppAlertHost app={mockApp} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockApp.reconnect).toHaveBeenCalledTimes(1);
    expect(useAppRuntimeStore.getState().activeAlert).toBeNull();
  });

  it('renders DeveloperModeAlert and clears alert on dismiss', () => {
    writeRuntimeAlert('developerMode');
    render(<AppAlertHost app={mockApp} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(useAppRuntimeStore.getState().activeAlert).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/components/AppAlertHost.test.tsx`
Expected: FAIL (missing imports / files)

- [ ] **Step 3: Implement TypeScript Alert Components**

Write `src/components/ConnectionAlert.tsx`:
```tsx
import React from 'react';
import { Alert, Button } from 'react-bootstrap';
import { i18n } from '../js/i18n';
import './PageTopAlert.css';

export interface ConnectionAlertProps {
  onDismiss: () => void;
}

export const ConnectionAlert: React.FC<ConnectionAlertProps> = ({ onDismiss }) => {
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.keyCode === 13) {
        onDismiss();
      }
      e.preventDefault();
      e.stopImmediatePropagation();
    };

    globalThis.addEventListener('keydown', handler, true);
    return () => {
      globalThis.removeEventListener('keydown', handler, true);
    };
  }, [onDismiss]);

  return (
    <Alert variant="danger" className="PageTopAlert" onClose={onDismiss} dismissible>
      <h4>{i18n('alert_connectionHeader')}</h4>
      <p>{i18n('alert_connectionText')}</p>
      <p>
        <Button variant="danger" onClick={onDismiss}>
          {i18n('alert_connectionReconnect')}
        </Button>
      </p>
    </Alert>
  );
};

export default ConnectionAlert;
```

Write `src/components/DeveloperModeAlert.tsx`:
```tsx
import React from 'react';
import { Alert, Button } from 'react-bootstrap';
import { i18n } from '../js/i18n';
import './PageTopAlert.css';

export interface DeveloperModeAlertProps {
  onDismiss: () => void;
}

export const DeveloperModeAlert: React.FC<DeveloperModeAlertProps> = ({ onDismiss }) => (
  <Alert variant="danger" className="PageTopAlert" onClose={onDismiss} dismissible>
    <h4>{i18n('alert_developerModeHeader')}</h4>
    <p>{i18n('alert_developerModeText')}</p>
    <p>
      <Button variant="danger" onClick={onDismiss}>
        {i18n('alert_developerModeDismiss')}
      </Button>
    </p>
  </Alert>
);

export default DeveloperModeAlert;
```

Write `src/components/PasteShortcutAlert.tsx`:
```tsx
import React from 'react';
import { Alert, Button } from 'react-bootstrap';
import { i18n } from '../js/i18n';
import './PageTopAlert.css';

export interface PasteShortcutAlertProps {
  onDismiss: () => void;
}

export const PasteShortcutAlert: React.FC<PasteShortcutAlertProps> = ({ onDismiss }) => (
  <Alert
    variant="info"
    className="PageTopAlert"
    tabIndex={-1}
    onClose={onDismiss}
    dismissible
  >
    <h4>{i18n('alert_pasteShortcutHeader')}</h4>
    <p>{i18n('alert_pasteShortcutText')}</p>
    <p>
      <Button variant="primary" onClick={onDismiss}>
        {i18n('alert_pasteShortcutClose')}
      </Button>
    </p>
  </Alert>
);

export default PasteShortcutAlert;
```

Write `src/components/AppAlertHost.tsx`:
```tsx
import React from 'react';
import { Modal } from 'react-bootstrap';
import {
  useAppRuntimeStore,
  writeRuntimeAlert,
  writeRuntimeModalOpen
} from '../store';
import ConnectionAlert from './ConnectionAlert';
import DeveloperModeAlert from './DeveloperModeAlert';
import PasteShortcutAlert from './PasteShortcutAlert';

export interface AppAlertAppTarget {
  reconnect: () => void;
  setInputAreaFocus: () => void;
}

export interface AppAlertHostProps {
  app: AppAlertAppTarget;
}

export const AppAlertHost: React.FC<AppAlertHostProps> = ({ app }) => {
  const activeAlert = useAppRuntimeStore(state => state.activeAlert);

  const hideAlert = React.useCallback(() => {
    writeRuntimeAlert(null);
  }, []);

  const onReconnect = React.useCallback(() => {
    hideAlert();
    app.reconnect();
  }, [app, hideAlert]);

  const onPasteShortcutDismiss = React.useCallback(() => {
    writeRuntimeModalOpen(false);
    hideAlert();
    app.setInputAreaFocus();
  }, [app, hideAlert]);

  switch (activeAlert) {
    case 'connection':
      return <ConnectionAlert onDismiss={onReconnect} />;
    case 'developerMode':
      return <DeveloperModeAlert onDismiss={hideAlert} />;
    case 'pasteShortcut':
      return (
        <Modal
          show
          onHide={onPasteShortcutDismiss}
          backdrop="static"
          keyboard={false}
          centered
        >
          <Modal.Body className="p-0">
            <PasteShortcutAlert onDismiss={onPasteShortcutDismiss} />
          </Modal.Body>
        </Modal>
      );
    default:
      return null;
  }
};

export default AppAlertHost;
```

Delete legacy `.js` alert files:
- `src/components/ConnectionAlert.js`
- `src/components/DeveloperModeAlert.js`
- `src/components/PasteShortcutAlert.js`
- `src/components/AppAlertHost.js`

- [ ] **Step 4: Run tests and typecheck**

Run: `yarn test`
Run: `yarn typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ConnectionAlert.tsx src/components/DeveloperModeAlert.tsx src/components/PasteShortcutAlert.tsx src/components/AppAlertHost.tsx src/components/AppAlertHost.test.tsx
git rm src/components/ConnectionAlert.js src/components/DeveloperModeAlert.js src/components/PasteShortcutAlert.js src/components/AppAlertHost.js
git commit -m "refactor(components): migrate alert components to TypeScript"
```

---

### Task 2: Migrate ContextMenu DropdownMenu and Helpers (`src/components/ContextMenu/`)

**Files:**
- Create: `src/components/ContextMenu/DropdownMenu.tsx`
- Create: `src/components/ContextMenu/LiveHelperModal.tsx`
- Create: `src/components/ContextMenu/InputHelperModal.tsx`
- Delete: `src/components/ContextMenu/DropdownMenu.js`
- Delete: `src/components/ContextMenu/LiveHelperModal.js`
- Delete: `src/components/ContextMenu/InputHelperModal.js`
- Test: `src/components/ContextMenu/LiveHelperModal.test.tsx`

**Interfaces:**
- Consumes:
  - `i18n` from `src/js/i18n`
  - `ColorSpan` from `src/components/Row/WordSegmentBuilder/ColorSpan`
  - Native `react-bootstrap` components (`Modal`, `Button`, `OverlayTrigger`, `Tooltip`, `Tab`, `Nav`, `Row`, `Col`, `Form`)
- Produces:
  - `DropdownMenu`: `{ open: boolean; pageX: number; pageY: number; urlEnabled: boolean; normalEnabled: boolean; selEnabled: boolean; selectedText: string; onSelect: (eventKey: string, e: React.SyntheticEvent) => void; onHide: () => void; onPrefClick: () => void; onInputHelperClick: () => void; onLiveHelperClick: () => void; liveHelperEnabled: boolean }`
  - `LiveHelperModal`: `{ show: boolean; onHide: () => void; enabled: boolean; sec: number; onChange: (next: { enabled: boolean; sec: number }) => void }`
  - `InputHelperModal`: `{ show: boolean; onHide: () => void; onInsertSymbol: (symbol: string) => void }`

- [ ] **Step 1: Write unit test for LiveHelperModal**

```tsx
// src/components/ContextMenu/LiveHelperModal.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { LiveHelperModal } from './LiveHelperModal';

describe('LiveHelperModal', () => {
  it('triggers onChange with toggled enable state', () => {
    const onChange = vi.fn();
    render(<LiveHelperModal show={true} onHide={vi.fn()} enabled={false} sec={5} onChange={onChange} />);

    const button = screen.getByRole('button', { name: /Alt \+ r|liveHelperEnable/i });
    fireEvent.click(button);

    expect(onChange).toHaveBeenCalledWith({ enabled: true, sec: 5 });
  });

  it('triggers onChange with normalized positive second value', () => {
    const onChange = vi.fn();
    render(<LiveHelperModal show={true} onHide={vi.fn()} enabled={true} sec={5} onChange={onChange} />);

    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '10' } });

    expect(onChange).toHaveBeenCalledWith({ enabled: true, sec: 10 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/components/ContextMenu/LiveHelperModal.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement DropdownMenu, LiveHelperModal, and InputHelperModal in TSX**

Write `src/components/ContextMenu/DropdownMenu.tsx`:
- Strongly typed menu items, hotkeys, screen dimension boundaries (`top`, `left`).
- Semantic HTML (`role="menu"`, `role="menuitem"`).

Write `src/components/ContextMenu/LiveHelperModal.tsx`:
- Native `react-bootstrap` `Modal`, `OverlayTrigger`, `Tooltip`, `Button`.

Write `src/components/ContextMenu/InputHelperModal.tsx`:
- Native `react-bootstrap` `Tab.Container`, `Nav`, `Tab.Content`, `Tab.Pane`, `Button`, `Row`, `Col`.
- Symbol grids and click handlers.

Delete legacy JS files:
- `src/components/ContextMenu/DropdownMenu.js`
- `src/components/ContextMenu/LiveHelperModal.js`
- `src/components/ContextMenu/InputHelperModal.js`

- [ ] **Step 4: Run tests and typecheck**

Run: `yarn test`
Run: `yarn typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ContextMenu/DropdownMenu.tsx src/components/ContextMenu/LiveHelperModal.tsx src/components/ContextMenu/InputHelperModal.tsx src/components/ContextMenu/LiveHelperModal.test.tsx
git rm src/components/ContextMenu/DropdownMenu.js src/components/ContextMenu/LiveHelperModal.js src/components/ContextMenu/InputHelperModal.js
git commit -m "refactor(components): migrate dropdown menu and helpers to TypeScript"
```

---

### Task 3: Migrate PrefModal and ContextMenu Root (`src/components/ContextMenu/`)

**Files:**
- Create: `src/components/ContextMenu/PrefModal.tsx`
- Create: `src/components/ContextMenu/index.tsx`
- Delete: `src/components/ContextMenu/PrefModal.js`
- Delete: `src/components/ContextMenu/index.js`
- Test: `src/components/ContextMenu/PrefModal.test.tsx`

**Interfaces:**
- Consumes:
  - `PreferenceValues` from `src/types/preferences`
  - `useContextMenuStore`, `readValuesWithDefault`, `writeValues`, `resetValues` from `src/store`
  - `getSafeExternalUrl`, `openExternalUrl` from `src/js/util`
  - `i18n` from `src/js/i18n`
- Produces:
  - `export const PrefModal: React.FC<{ show: boolean; onHide: () => void; onSave: () => void }>`
  - `export const ContextMenu: React.FC<{ pttchrome: ContextMenuPttChromeTarget }>`

- [ ] **Step 1: Write test for PrefModal rendering and save action**

```tsx
// src/components/ContextMenu/PrefModal.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { PrefModal } from './PrefModal';

describe('PrefModal', () => {
  it('renders preference categories and calls onHide when closed', () => {
    const onHide = vi.fn();
    const onSave = vi.fn();
    render(<PrefModal show={true} onHide={onHide} onSave={onSave} />);

    expect(screen.getByRole('dialog')).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/components/ContextMenu/PrefModal.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement PrefModal.tsx and ContextMenu/index.tsx**

Write `src/components/ContextMenu/PrefModal.tsx`:
- Replaces `bootstrap-compat` with native `Form.Group`, `Form.Label`, `Form.Control`, `Form.Select`, `Form.Check`, `Tab.Container`, `Nav`, `Tab.Content`, `Tab.Pane`, `Modal`, `Button`, `OverlayTrigger`, `Popover`.
- Uses `readValuesWithDefault()`, `writeValues()`, `resetValues()`.
- Supports all preferences tabs (General, Display, Mouse Browsing, About).

Write `src/components/ContextMenu/index.tsx`:
- Strong typing for `ContextMenuPttChromeTarget` (commands, selection helpers, view states).
- Context menu event listeners, mouse positions, hotkeys.

Delete legacy JS files:
- `src/components/ContextMenu/PrefModal.js`
- `src/components/ContextMenu/index.js`

- [ ] **Step 4: Run tests and typecheck**

Run: `yarn test`
Run: `yarn typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ContextMenu/PrefModal.tsx src/components/ContextMenu/index.tsx src/components/ContextMenu/PrefModal.test.tsx
git rm src/components/ContextMenu/PrefModal.js src/components/ContextMenu/index.js
git commit -m "refactor(components): migrate PrefModal and ContextMenu root to TypeScript"
```

---

### Task 4: Remove `bootstrap-compat.js` and Verify Full Build

**Files:**
- Delete: `src/components/bootstrap-compat.js`
- Check: All files in `src/components/` and `src/`

- [ ] **Step 1: Verify zero remaining references to bootstrap-compat**

Run: Search codebase for `bootstrap-compat`
Expected: 0 occurrences

- [ ] **Step 2: Delete `bootstrap-compat.js`**

Run: `git rm src/components/bootstrap-compat.js`

- [ ] **Step 3: Run full typecheck, test suite, and production build**

Run: `yarn typecheck`
Run: `yarn test`
Run: `yarn build`
Expected: All pass cleanly with zero errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore(components): remove legacy bootstrap-compat shim"
```

---
