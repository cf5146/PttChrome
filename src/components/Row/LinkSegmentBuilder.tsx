import type { ReactNode } from "react";

import cx from "classnames";

import {
  InlineImagePreview,
  createInlineImagePreviewRequest,
} from "../ImagePreviewer";
import ColorSegmentBuilder from "./ColorSegmentBuilder";
import HyperLink from "./HyperLink";
import type { HyperLinkEventHandler, TerminalCharacter } from "./types";

export class LinkSegmentBuilder {
  static accumulator(
    builder: LinkSegmentBuilder,
    ch: TerminalCharacter,
    i: number
  ) {
    builder.readChar(ch, i);
    return builder;
  }

  row: number;

  forceWidth: number;

  highlighted: boolean | undefined;

  onHyperLinkMouseOver: HyperLinkEventHandler | undefined;

  onHyperLinkMouseOut: HyperLinkEventHandler | undefined;

  segs: ReactNode[];

  inlineLinkPreviews: ReactNode[] | false;

  colorSegBuilder: ColorSegmentBuilder | null;

  col: number;

  href: string | null;

  constructor(
    row: number,
    enableLinkInlinePreview: boolean,
    forceWidth: number,
    highlighted: boolean | undefined,
    onHyperLinkMouseOver: HyperLinkEventHandler | undefined,
    onHyperLinkMouseOut: HyperLinkEventHandler | undefined
  ) {
    this.row = row;
    this.forceWidth = forceWidth;
    this.highlighted = highlighted;
    this.onHyperLinkMouseOver = onHyperLinkMouseOver;
    this.onHyperLinkMouseOut = onHyperLinkMouseOut;
    this.segs = [];
    this.inlineLinkPreviews = enableLinkInlinePreview ? [] : false;
    this.colorSegBuilder = null;
    this.col = 0;
    this.href = null;
  }

  saveSegment() {
    if (!this.colorSegBuilder) {
      return;
    }

    const element = this.colorSegBuilder.build();
    if (this.href) {
      this.segs.push(
        <HyperLink
          key={this.col}
          col={this.col}
          row={this.row}
          href={this.href}
          inner={element}
          onMouseOver={this.onHyperLinkMouseOver}
          onMouseOut={this.onHyperLinkMouseOut}
        />
      );

      if (this.inlineLinkPreviews) {
        this.inlineLinkPreviews.push(
          <InlineImagePreview
            key={`${this.col}-${this.href}`}
            request={createInlineImagePreviewRequest(this.href)}
          />
        );
      }
    } else {
      this.segs.push(<span key={this.col}>{element}</span>);
    }

    this.colorSegBuilder = null;
  }

  readChar(ch: TerminalCharacter, i: number) {
    if (this.colorSegBuilder !== null && ch.isStartOfURL()) {
      this.saveSegment();
    }

    if (this.colorSegBuilder === null) {
      this.colorSegBuilder = new ColorSegmentBuilder(this.forceWidth);
      this.col = i;
      this.href = ch.isStartOfURL() ? ch.getFullURL() : null;
    }

    this.colorSegBuilder.readChar(ch);
    if (ch.isEndOfURL()) {
      this.saveSegment();
    }
  }

  build() {
    if (this.colorSegBuilder !== null) {
      this.saveSegment();
    }

    return (
      <div>
        <span
          className={cx({ b2: this.highlighted })}
          data-type="bbsline"
          data-row={this.row}
        >
          {this.segs}
        </span>
        <div>{this.inlineLinkPreviews}</div>
      </div>
    );
  }
}

export default LinkSegmentBuilder;