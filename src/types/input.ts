import type { CursorPosition } from './terminal';

export type KeyboardEventMeta = {
  key: string;
  code?: string;
  keyCode: number;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
  isComposing?: boolean;
  getModifierState(key: string): boolean;
};

export type KeyboardSend = (data: string) => boolean | void;

export type MouseButtonFunction = 0 | 1 | 2 | 3;

export type MouseWheelFunction = 0 | 1 | 2 | 3;

export type MouseBrowsingState = {
  enabled: boolean;
  highlight: boolean;
  highlightColor: number;
  leftButtonFunction: MouseButtonFunction;
  middleButtonFunction: MouseButtonFunction;
  wheelFunction1: MouseWheelFunction;
  wheelFunction2: MouseWheelFunction;
  wheelFunction3: MouseWheelFunction;
  cursor: number;
  highlightedRow: number;
  tempPosition: CursorPosition;
};

export type TouchPoint = {
  identifier: number;
  clientX: number;
  clientY: number;
};

export type TouchGestureConfig = {
  enabled: boolean;
  minChromeVersion: number;
  singleTouchOnly: boolean;
  preventDefaultOnMove: boolean;
};

export type TouchGestureState = {
  started: boolean;
  moved: boolean;
  identifier: number | null;
  center: CursorPosition;
  target: EventTarget | null;
};