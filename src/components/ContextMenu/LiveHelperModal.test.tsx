// @vitest-environment jsdom

import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setupI18n } from '../../js/i18n';
import { LiveHelperModal } from './LiveHelperModal';

const reactActEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

describe('LiveHelperModal', () => {
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

  it('triggers onChange with toggled enable state', async () => {
    const onChange = vi.fn();
    await act(async () => {
      root.render(
        <LiveHelperModal
          show={true}
          onHide={vi.fn()}
          enabled={false}
          sec={5}
          onChange={onChange}
        />
      );
    });

    const button = document.body.querySelector(
      '.LiveHelperModal__Body button.btn'
    ) as HTMLButtonElement;
    expect(button).not.toBeNull();

    await act(async () => {
      button.click();
    });

    expect(onChange).toHaveBeenCalledWith({ enabled: true, sec: 5 });
  });

  it('triggers onChange with normalized positive second value', async () => {
    const onChange = vi.fn();
    await act(async () => {
      root.render(
        <LiveHelperModal
          show={true}
          onHide={vi.fn()}
          enabled={true}
          sec={5}
          onChange={onChange}
        />
      );
    });

    const input = document.body.querySelector(
      '.LiveHelperModal__Body__Input'
    ) as HTMLInputElement;
    expect(input).not.toBeNull();

    await act(async () => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set;
      nativeInputValueSetter?.call(input, '10');
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    expect(onChange).toHaveBeenCalledWith({ enabled: true, sec: 10 });
  });
});

