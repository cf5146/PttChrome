import type React from "react";

export type HyperLinkEvent =
  | React.MouseEvent<HTMLAnchorElement>
  | React.FocusEvent<HTMLAnchorElement>;

export type HyperLinkEventHandler = (event: HyperLinkEvent) => void;

export type TerminalColor = {
  equals: (other: unknown) => boolean;
  [key: string]: unknown;
};

export type TerminalCharacter = {
  ch: string;
  getColor: () => TerminalColor;
  isStartOfURL: () => boolean;
  isEndOfURL: () => boolean;
  getFullURL: () => string;
  [key: string]: unknown;
};

export type RowProps = {
  chars: TerminalCharacter[];
  row: number;
  enableLinkInlinePreview: boolean;
  forceWidth: number;
  highlighted?: boolean;
  onHyperLinkMouseOver?: HyperLinkEventHandler;
  onHyperLinkMouseOut?: HyperLinkEventHandler;
};