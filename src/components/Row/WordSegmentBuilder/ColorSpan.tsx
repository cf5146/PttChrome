import type { ReactNode } from "react";

import cx from "classnames";

import type { TerminalColor } from "../types";

type ColorSpanProps = {
  className?: string;
  colorState: TerminalColor;
  inner: ReactNode;
};

export const ColorSpan = ({ className, colorState, inner }: ColorSpanProps) => (
  <span
    className={cx(className, `q${colorState.fg}`, `b${colorState.bg}`, {
      [`qq${colorState.bg}`]: colorState.blink,
    })}
  >
    {inner}
  </span>
);

export default ColorSpan;