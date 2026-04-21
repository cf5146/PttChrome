import type { ReactNode } from "react";

import WordSegmentBuilder from "./WordSegmentBuilder";
import { b2u, isDBCSLead } from "../../js/string_util";
import { symbolTable } from "../../js/symbol_table";
import type { TerminalCharacter, TerminalColor } from "./types";

type ActiveWordBuilder = {
  isLastSegmentSameColor: (color: TerminalColor | undefined) => boolean;
  build: () => ReactNode;
  appendNormalText: (text: string) => void;
  appendForceWidthWord: (text: string, forceWidth: number) => void;
  appendTwoColorWord: (
    text: string,
    colorLead: TerminalColor,
    colorTail: TerminalColor,
    forceWidth: number
  ) => void;
};

type WordBuilderLike = {
  isLastSegmentSameColor: (color: TerminalColor | undefined) => boolean;
  build: () => ReactNode | false;
  appendNormalText?: (text: string) => void;
  appendForceWidthWord?: (text: string, forceWidth: number) => void;
  appendTwoColorWord?: (
    text: string,
    colorLead: TerminalColor,
    colorTail: TerminalColor,
    forceWidth: number
  ) => void;
};

const getSymbolCode = (text: string) =>
  symbolTable[`x${(text.codePointAt(0) ?? 0).toString(16)}`] as
    | number
    | undefined;

function isBadDBCS(text: string) {
  return getSymbolCode(text) === 3;
}

function shouldForceWidth(text: string) {
  const code = getSymbolCode(text);
  return code === 1 || code === 2;
}

const asActiveWordBuilder = (builder: WordBuilderLike): ActiveWordBuilder =>
  builder as ActiveWordBuilder;

export class ColorSegmentBuilder {
  static accumulator(builder: ColorSegmentBuilder, ch: TerminalCharacter) {
    builder.readChar(ch);
    return builder;
  }

  segs: ReactNode[];

  wordBuilder: WordBuilderLike;

  forceWidth: number;

  lead: TerminalCharacter | null;

  constructor(forceWidth: number) {
    this.segs = [];
    this.wordBuilder = WordSegmentBuilder.NullObject as WordBuilderLike;
    this.forceWidth = forceWidth;
    this.lead = null;
  }

  beginSegment(color?: TerminalColor) {
    this.segs.push(this.wordBuilder.build());
    this.wordBuilder = new WordSegmentBuilder(
      this.segs.length,
      color
    ) as ActiveWordBuilder;
  }

  appendNormalChar(text: string, color: TerminalColor) {
    if (!this.wordBuilder.isLastSegmentSameColor(color)) {
      this.beginSegment(color);
    }

    asActiveWordBuilder(this.wordBuilder).appendNormalText(text);
  }

  readChar(ch: TerminalCharacter) {
    if (!this.lead) {
      if (isDBCSLead(ch.ch)) {
        this.lead = ch;
        return;
      }

      this.appendNormalChar(ch.ch, ch.getColor());
      return;
    }

    const { lead } = this;
    const leadColor = lead.getColor();
    this.lead = null;
    const text = b2u(lead.ch + ch.ch);

    if (text.length !== 1) {
      this.appendNormalChar("?", leadColor);
      this.appendNormalChar(ch.ch === "\x20" ? " " : "?", ch.getColor());
      return;
    }

    if (isBadDBCS(text)) {
      this.appendNormalChar("?", leadColor);
      this.appendNormalChar("?", ch.getColor());
      return;
    }

    if (!leadColor.equals(ch.getColor())) {
      this.beginSegment(leadColor);
      asActiveWordBuilder(this.wordBuilder).appendTwoColorWord(
        text,
        leadColor,
        ch.getColor(),
        this.forceWidth
      );
      return;
    }

    const forceWidth = shouldForceWidth(text) ? this.forceWidth : 0;
    if (!forceWidth) {
      this.appendNormalChar(text, leadColor);
      return;
    }

    if (!this.wordBuilder.isLastSegmentSameColor(leadColor)) {
      this.beginSegment(leadColor);
    }

    asActiveWordBuilder(this.wordBuilder).appendForceWidthWord(
      text,
      forceWidth
    );
  }

  build() {
    this.beginSegment();
    return this.segs;
  }
}

export default ColorSegmentBuilder;