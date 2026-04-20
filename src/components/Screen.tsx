import PropTypes from "prop-types";
import React from "react";

import {
  HoverImagePreview,
  createHoverImagePreviewRequest,
} from "./ImagePreviewer";
import type { HoverPreviewValue, PreviewRequest } from "./ImagePreviewer.types";
import Row from "./Row";
import type { HyperLinkEvent, RowProps, TerminalCharacter } from "./Row/types";

type ScreenProps = {
  lines: TerminalCharacter[][];
  forceWidth: number;
  enableLinkInlinePreview: boolean;
  enableLinkHoverPreview: boolean;
};

type ScreenHandle = {
  setCurrentHighlighted: React.Dispatch<React.SetStateAction<number | undefined>>;
};

type HoverPosition = {
  left: number | undefined;
  top: number | undefined;
};

const createHoverPosition = (event: HyperLinkEvent): HoverPosition => ({
  left: "clientX" in event ? event.clientX : undefined,
  top: "clientY" in event ? event.clientY : undefined,
});

export const Screen = React.forwardRef<ScreenHandle, ScreenProps>(function Screen(
  props,
  ref
) {
  const {
    lines,
    forceWidth,
    enableLinkInlinePreview,
    enableLinkHoverPreview,
  } = props;
  const [currentHighlighted, setCurrentHighlighted] = React.useState<
    number | undefined
  >();
  const [currentImagePreview, setCurrentImagePreview] = React.useState<
    PreviewRequest<HoverPreviewValue> | undefined
  >();
  const [hoverPosition, setHoverPosition] = React.useState<HoverPosition>({
    left: undefined,
    top: undefined,
  });
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useImperativeHandle(
    ref,
    () => ({
      setCurrentHighlighted,
    }),
    []
  );

  React.useEffect(() => {
    setCurrentImagePreview(undefined);
  }, [lines]);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (!currentImagePreview) {
        return;
      }

      setHoverPosition({
        left: event.clientX,
        top: event.clientY,
      });
    };

    container.addEventListener("mousemove", handleMouseMove);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
    };
  }, [currentImagePreview]);

  const handleHyperLinkMouseOver: RowProps["onHyperLinkMouseOver"] = (event) => {
    if (!enableLinkHoverPreview) {
      return;
    }

    setHoverPosition(createHoverPosition(event));
    setCurrentImagePreview(createHoverImagePreviewRequest(event.currentTarget.href));
  };

  const handleHyperLinkMouseOut: RowProps["onHyperLinkMouseOut"] = () => {
    setCurrentImagePreview(undefined);
  };

  const rows = lines.map((line, row) => (
    <Row
      key={`row-${row}`}
      chars={line}
      row={row}
      forceWidth={forceWidth}
      enableLinkInlinePreview={enableLinkInlinePreview}
      highlighted={currentHighlighted === row}
      onHyperLinkMouseOver={handleHyperLinkMouseOver}
      onHyperLinkMouseOut={handleHyperLinkMouseOut}
    />
  ));

  return (
    <div id="mainContainer" ref={containerRef}>
      {rows}
      {currentImagePreview ? (
        <HoverImagePreview
          request={currentImagePreview}
          left={hoverPosition.left}
          top={hoverPosition.top}
        />
      ) : null}
    </div>
  );
});

Screen.propTypes = {
  lines: PropTypes.arrayOf(PropTypes.array).isRequired,
  forceWidth: PropTypes.number.isRequired,
  enableLinkInlinePreview: PropTypes.bool.isRequired,
  enableLinkHoverPreview: PropTypes.bool.isRequired,
};

Screen.displayName = "Screen";

export default Screen;