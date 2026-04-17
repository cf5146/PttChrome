import Row from "../components/Row";
import Screen from "../components/Screen";
import { renderReactElement, renderScreenElement } from "./react_roots";

export class ColorState {
  constructor(fg, bg, blink) {
    this.fg = fg;
    this.bg = bg;
    this.blink = blink;
  }

  equals(oth) {
    if (oth instanceof ColorState) {
      return this.fg == oth.fg && this.bg == oth.bg && this.blink == oth.blink;
    }
    return false;
  }
}

/**
 * @deprecated
 */
export function renderRowHtml(chars, row, forceWidth, enableLinkInlinePreview, cont) {
  renderReactElement(
    cont,
    <Row
      chars={chars}
      row={row}
      forceWidth={forceWidth}
      enableLinkInlinePreview={enableLinkInlinePreview}
    />
  );
}

export function renderScreen(lines, forceWidth, enableLinkInlinePreview, enableLinkHoverPreview, cont) {
  return renderScreenElement(
    cont,
    <Screen
      lines={lines}
      forceWidth={forceWidth}
      enableLinkInlinePreview={enableLinkInlinePreview}
      enableLinkHoverPreview={enableLinkHoverPreview}
    />
  );
}
