import PropTypes from "prop-types";
import React from "react";
import Row from "./Row";
import ImagePreviewer, {
  of,
  resolveSrcToImageUrl,
  resolveWithImageDOM
} from "./ImagePreviewer";

export const Screen = React.forwardRef(function Screen(props, ref) {
  const {
    lines,
    forceWidth,
    enableLinkInlinePreview,
    enableLinkHoverPreview
  } = props;
  const [currentHighlighted, setCurrentHighlighted] = React.useState();
  const [currentImagePreview, setCurrentImagePreview] = React.useState();
  const [hoverPosition, setHoverPosition] = React.useState({
    left: undefined,
    top: undefined
  });
  const containerRef = React.useRef(null);

  React.useImperativeHandle(
    ref,
    () => ({
      setCurrentHighlighted
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

    const handleMouseMove = event => {
      if (!currentImagePreview) {
        return;
      }

      setHoverPosition({
        left: event.clientX,
        top: event.clientY
      });
    };

    container.addEventListener("mousemove", handleMouseMove);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
    };
  }, [currentImagePreview]);

  const handleHyperLinkMouseOver = event => {
    if (!enableLinkHoverPreview) {
      return;
    }

    setHoverPosition({
      left: event.clientX,
      top: event.clientY
    });
    setCurrentImagePreview(
      of(event.currentTarget.href)
        .then(resolveSrcToImageUrl)
        .then(resolveWithImageDOM)
    );
  };

  const handleHyperLinkMouseOut = () => {
    setCurrentImagePreview(undefined);
  };

  const rows = [];
  for (let row = 0; row < lines.length; row += 1) {
    rows.push(
      <Row
        key={`row-${row}`}
        chars={lines[row]}
        row={row}
        forceWidth={forceWidth}
        enableLinkInlinePreview={enableLinkInlinePreview}
        highlighted={currentHighlighted === row}
        onHyperLinkMouseOver={handleHyperLinkMouseOver}
        onHyperLinkMouseOut={handleHyperLinkMouseOut}
      />
    );
  }

  return (
    <div id="mainContainer" ref={containerRef}>
      {rows}
      {currentImagePreview ? (
        <ImagePreviewer
          request={currentImagePreview}
          component={ImagePreviewer.OnHover}
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
  enableLinkHoverPreview: PropTypes.bool.isRequired
};

Screen.displayName = "Screen";

export default Screen;
