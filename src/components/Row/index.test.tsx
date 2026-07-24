// @vitest-environment jsdom

import { act } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import Row from './index';

const reactActEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

const createColorState = () => ({
  fg: 7,
  bg: 0,
  blink: false,
  equals(other: unknown) {
    return (
      typeof other === 'object' &&
      other !== null &&
      (other as { fg?: number }).fg === 7 &&
      (other as { bg?: number }).bg === 0 &&
      (other as { blink?: boolean }).blink === false
    );
  }
});

const createTerminalCharacter = (ch: string) => ({
  ch,
  getColor: createColorState,
  isStartOfURL: () => false,
  isEndOfURL: () => false,
  getFullURL: () => ''
});

describe('Row', () => {
  let container: HTMLDivElement;
  let root: Root;
  let previousActEnvironment: boolean | undefined;

  beforeEach(() => {
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
    if (previousActEnvironment === undefined) {
      delete reactActEnvironment.IS_REACT_ACT_ENVIRONMENT;
    } else {
      reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
    }
  });

  it('renders HTML-like terminal text as text nodes', async () => {
    const terminalText = '<img src=x onerror=alert(1)>';

    await act(async () => {
      root.render(
        <Row
          chars={Array.from(terminalText, createTerminalCharacter)}
          row={0}
          enableLinkInlinePreview={false}
          forceWidth={0}
        />
      );
    });

    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('[onerror]')).toBeNull();
    expect(container.textContent).toBe(terminalText);
  });
});
