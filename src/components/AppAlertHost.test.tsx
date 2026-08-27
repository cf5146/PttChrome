// @vitest-environment jsdom

import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setupI18n } from '../js/i18n';
import {
  useAppRuntimeStore,
  useContextMenuStore,
  writeRuntimeAlert,
  writeRuntimeModalOpen
} from '../store';
import { AppAlertHost, type AppAlertAppTarget } from './AppAlertHost';

const reactActEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

describe('AppAlertHost', () => {
  let container: HTMLDivElement;
  let root: Root;
  let previousActEnvironment: boolean | undefined;

  const mockApp: AppAlertAppTarget = {
    reconnect: vi.fn(),
    setInputAreaFocus: vi.fn()
  };

  beforeEach(() => {
    setupI18n();
    previousActEnvironment = reactActEnvironment.IS_REACT_ACT_ENVIRONMENT;
    reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    vi.clearAllMocks();
    writeRuntimeAlert(null);
    writeRuntimeModalOpen(false);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    document.body.querySelectorAll('.modal, .modal-backdrop').forEach(el => el.remove());
    if (previousActEnvironment === undefined) {
      delete reactActEnvironment.IS_REACT_ACT_ENVIRONMENT;
    } else {
      reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
    }
  });

  it('renders nothing when activeAlert is null', async () => {
    await act(async () => {
      root.render(<AppAlertHost app={mockApp} />);
    });
    expect(container.firstChild).toBeNull();
  });

  it('renders ConnectionAlert and triggers reconnect on dismiss button click', async () => {
    act(() => {
      writeRuntimeAlert('connection');
    });

    await act(async () => {
      root.render(<AppAlertHost app={mockApp} />);
    });

    const alertElement = container.querySelector('.alert-danger');
    expect(alertElement).not.toBeNull();

    const reconnectButton = container.querySelector('button.btn-danger') as HTMLButtonElement;
    expect(reconnectButton).not.toBeNull();

    await act(async () => {
      reconnectButton.click();
    });

    expect(mockApp.reconnect).toHaveBeenCalledTimes(1);
    expect(useAppRuntimeStore.getState().activeAlert).toBeNull();
  });

  it('triggers reconnect when Enter key is pressed while ConnectionAlert is open', async () => {
    act(() => {
      writeRuntimeAlert('connection');
    });

    await act(async () => {
      root.render(<AppAlertHost app={mockApp} />);
    });

    await act(async () => {
      globalThis.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
      );
    });

    expect(mockApp.reconnect).toHaveBeenCalledTimes(1);
    expect(useAppRuntimeStore.getState().activeAlert).toBeNull();
  });

  it('renders DeveloperModeAlert and clears alert on dismiss', async () => {
    act(() => {
      writeRuntimeAlert('developerMode');
    });

    await act(async () => {
      root.render(<AppAlertHost app={mockApp} />);
    });

    const alertElement = container.querySelector('.alert-danger');
    expect(alertElement).not.toBeNull();

    const dismissButton = container.querySelector('button.btn-danger') as HTMLButtonElement;
    expect(dismissButton).not.toBeNull();

    await act(async () => {
      dismissButton.click();
    });

    expect(useAppRuntimeStore.getState().activeAlert).toBeNull();
  });

  it('renders PasteShortcutAlert in a modal and clears alert on dismiss', async () => {
    act(() => {
      writeRuntimeAlert('pasteShortcut');
      writeRuntimeModalOpen(true);
    });

    await act(async () => {
      root.render(<AppAlertHost app={mockApp} />);
    });

    const modalBody = document.body.querySelector('.modal-body');
    expect(modalBody).not.toBeNull();

    const closeButton = document.body.querySelector('.modal button.btn-primary') as HTMLButtonElement;
    expect(closeButton).not.toBeNull();

    await act(async () => {
      closeButton.click();
    });

    expect(mockApp.setInputAreaFocus).toHaveBeenCalledTimes(1);
    expect(useContextMenuStore.getState().runtimeModalOpen).toBe(false);
    expect(useAppRuntimeStore.getState().activeAlert).toBeNull();
  });
});
