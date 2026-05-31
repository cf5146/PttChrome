export type TerminalColorIndex =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15;

export type TerminalColorValue = TerminalColorIndex | (number & {});

export type ColorAttribute = {
  fg: TerminalColorValue;
  bg: TerminalColorValue;
  bright: boolean;
  invert: boolean;
  blink: boolean;
  underLine: boolean;
};

export type BlinkState = {
  blink: boolean;
  blinkOn: boolean;
};

export type CursorPosition = {
  x: number;
  y: number;
};

export type UrlRange = [start: number, end: number];

export interface TermChar extends ColorAttribute {
  ch: string;
  needUpdate: boolean;
  isLeadByte: boolean;
  startOfURL: boolean;
  endOfURL: boolean;
  partOfURL: boolean;
  partOfKeyWord: boolean;
  keyWordColor: string;
  fullurl: string;
  assignParams(params: number[]): void;
  copyFromNewChar(): void;
  copyAttr(attr: ColorAttribute): void;
  resetAttr(): void;
  getFg(): number;
  getBg(): number;
  getColor(): unknown;
  isUnderLine(): boolean;
  isStartOfURL(): boolean;
  isEndOfURL(): boolean;
  isPartOfURL(): boolean;
  isPartOfKeyWord(): boolean;
  getKeyWordColor(): string;
  getFullURL(): string;
}

export type TermRow = TermChar[] & {
  uris?: UrlRange[] | null;
};

export type ScreenBuffer = {
  cols: number;
  rows: number;
  cur_x: number;
  cur_y: number;
  cur_x_sav: number;
  cur_y_sav: number;
  scrollStart: number;
  scrollEnd: number;
  lines: TermRow[];
  lineChangeds: Array<boolean | undefined>;
  attr: TermChar;
  changed: boolean;
  posChanged: boolean;
  pageState: number;
  forceFullWidth: boolean;
  nowHighlight: number;
  tempMouseCol: number;
  tempMouseRow: number;
  mouseCursor: number;
  highlightCursor: boolean;
  useMouseBrowsing: boolean;
};