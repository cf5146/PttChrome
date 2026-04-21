import type React from "react";

type ForceWidthStyle = React.CSSProperties | undefined;

type ForceWidthWordProps = {
  forceWidth: number;
  inner: React.ReactNode;
};

export const forceWidthStyle = (forceWidth: number): ForceWidthStyle =>
  forceWidth
    ? {
        display: "inline-block",
        width: `${forceWidth}px`,
      }
    : undefined;

export const ForceWidthWord = ({
  forceWidth,
  inner,
}: ForceWidthWordProps) => (
  <span className="wpadding" style={forceWidthStyle(forceWidth)}>
    {inner}
  </span>
);

export default ForceWidthWord;