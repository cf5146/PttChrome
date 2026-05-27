import type { ScreenBuffer } from './terminal';

export type AnsiParserState = 0 | 1 | 2 | 3;

export type AnsiParserStateName = 'text' | 'escape' | 'csi' | 'c1';

export type KnownEscapeCode =
  | '@'
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'G'
  | 'H'
  | 'I'
  | 'J'
  | 'K'
  | 'L'
  | 'M'
  | 'P'
  | 'S'
  | 'T'
  | 'X'
  | 'Z'
  | '`'
  | 'd'
  | 'e'
  | 'f'
  | 'm'
  | 'r'
  | 's'
  | 'u';

export type EscapeCode = KnownEscapeCode | (string & {});

export type AnsiSequenceKind = 'text' | 'escape' | 'csi' | 'c1';

export type AnsiSequence = {
  kind: AnsiSequenceKind;
  raw: string;
  params: number[];
  finalCode?: EscapeCode;
  privatePrefix?: string;
};

export type AnsiParserContext = {
  termbuf: ScreenBuffer | null;
  state: AnsiParserState;
  esc: string;
};