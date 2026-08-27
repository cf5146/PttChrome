// @vitest-environment jsdom

import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { i18n, setupI18n } from '../../js/i18n';
import { resetValues, usePreferencesStore } from '../../store';
import { PrefModal } from './PrefModal';

const reactActEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

describe('PrefModal', () => {
  let container: HTMLDivElement;
  let root: Root;
  let previousActEnvironment: boolean | undefined;

  beforeEach(() => {
    setupI18n();
    previousActEnvironment = reactActEnvironment.IS_REACT_ACT_ENVIRONMENT;
    reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    vi.clearAllMocks();
    resetValues();
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

  it('renders preference categories and calls onSave and onHide when close button clicked', async () => {
    const onHide = vi.fn();
    const onSave = vi.fn();

    await act(async () => {
      root.render(<PrefModal show={true} onHide={onHide} onSave={onSave} />);
    });

    const dialog = document.body.querySelector('.PrefModal .modal-dialog');
    expect(dialog).not.toBeNull();

    const title = document.body.querySelector('.PrefModal__Grid__Col--left h3');
    expect(title?.textContent).toBe(i18n('menu_settings'));

    const closeBtn = document.body.querySelector(
      '.PrefModal__Grid__Col--right button.close'
    ) as HTMLButtonElement;
    expect(closeBtn).not.toBeNull();

    await act(async () => {
      closeBtn.click();
    });

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onHide).toHaveBeenCalledTimes(1);
  });

  it('handles reset action correctly', async () => {
    const onSave = vi.fn();
    const onReset = vi.fn();

    await act(async () => {
      root.render(<PrefModal show={true} onSave={onSave} onReset={onReset} />);
    });

    const resetBtn = document.body.querySelector(
      '.PrefModal__Grid__Col--left__Reset'
    ) as HTMLButtonElement;
    expect(resetBtn).not.toBeNull();

    await act(async () => {
      resetBtn.click();
    });

    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('allows switching between tabs', async () => {
    const onSave = vi.fn();

    await act(async () => {
      root.render(<PrefModal show={true} onSave={onSave} />);
    });

    const aboutTabLink = document.body.querySelector(
      '.PrefModal__Grid__Col--left a[data-rr-ui-event-key="about"], .PrefModal__Grid__Col--left [role="tab"]:nth-child(2), .PrefModal__Grid__Col--left .nav-link:nth-of-type(2), .PrefModal__Grid__Col--left .nav-item:nth-of-type(2) .nav-link'
    ) as HTMLElement;
    expect(aboutTabLink).not.toBeNull();

    await act(async () => {
      aboutTabLink.click();
    });

    const aboutContent = document.body.querySelector(
      '.PrefModal__Grid__Col--right'
    );
    expect(aboutContent?.textContent).toContain(i18n('about_appName_subtitle'));
  });

  it('updates form controls on change and persists on save', async () => {
    const onSave = vi.fn();

    await act(async () => {
      root.render(<PrefModal show={true} onSave={onSave} />);
    });

    const lineWrapInput = document.body.querySelector(
      'input[name="lineWrap"]'
    ) as HTMLInputElement;
    expect(lineWrapInput).not.toBeNull();

    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set;
      setter?.call(lineWrapInput, '100');
      lineWrapInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const closeBtn = document.body.querySelector(
      '.PrefModal__Grid__Col--right button.close'
    ) as HTMLButtonElement;

    await act(async () => {
      closeBtn.click();
    });

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        lineWrap: 100
      })
    );
    expect(usePreferencesStore.getState().values.lineWrap).toBe(100);
  });
});
