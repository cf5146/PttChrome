import type { ReactNode } from "react";

import ColorSpan from "./ColorSpan";
import ForceWidthWord from "./ForceWidthWord";
import TwoColorWord from "./TwoColorWord";
import type { TerminalColor } from "../types";

type WordBuilderNullObject = {
  isLastSegmentSameColor: (color?: TerminalColor) => false;
  build: () => false;
};

export class WordSegmentBuilder {
  static readonly NullObject: WordBuilderNullObject = {
    isLastSegmentSameColor() {
      return false;
    },

    build() {
      return false;
    },
  };

  key: number;

  colorState: TerminalColor | undefined;

  inner: ReactNode[];

  constructor(key: number, colorState?: TerminalColor) {
    this.key = key;
    this.colorState = colorState;
    this.inner = [];
  }

  isLastSegmentSameColor(color: TerminalColor | undefined) {
    return this.colorState?.equals(color) ?? false;
  }

  appendNormalText(text: string) {
    const last = this.inner.slice(-1)[0];
    if (typeof last === "string") {
      this.inner[this.inner.length - 1] = last + text;
      return;
    }

    this.inner.push(text);
  }

  appendForceWidthWord(text: string, forceWidth: number) {
    this.inner.push(
      <ForceWidthWord
        key={this.inner.length}
        inner={text}
        forceWidth={forceWidth}
      />
    );
  }

  appendTwoColorWord(
    text: string,
    colorLead: TerminalColor,
    colorTail: TerminalColor,
    forceWidth: number
  ) {
    this.inner.push(
      <TwoColorWord
        key={this.inner.length}
        text={text}
        colorLead={colorLead}
        colorTail={colorTail}
        forceWidth={forceWidth}
      />
    );
  }

  build() {
    if (!this.colorState) {
      return false;
    }

    return (
      <ColorSpan
        key={this.key}
        colorState={this.colorState}
        inner={this.inner}
      />
    );
  }
}

export default WordSegmentBuilder;