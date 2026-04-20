import PropTypes from "prop-types";

import LinkSegmentBuilder from "./LinkSegmentBuilder";
import type { RowProps } from "./types";

export const Row = ({
  chars,
  row,
  enableLinkInlinePreview,
  forceWidth,
  highlighted,
  onHyperLinkMouseOver,
  onHyperLinkMouseOut,
}: RowProps) => (
  <span data-type="bbsrow" data-srow={row}>
    {chars
      .reduce(
        (builder, ch, index) => LinkSegmentBuilder.accumulator(builder, ch, index),
        new LinkSegmentBuilder(
          row,
          enableLinkInlinePreview,
          forceWidth,
          highlighted,
          onHyperLinkMouseOver,
          onHyperLinkMouseOut
        )
      )
      .build()}
  </span>
);

Row.propTypes = {
  chars: PropTypes.array.isRequired,
  row: PropTypes.number.isRequired,
  enableLinkInlinePreview: PropTypes.bool.isRequired,
  forceWidth: PropTypes.number.isRequired,
  highlighted: PropTypes.bool,
  onHyperLinkMouseOver: PropTypes.func,
  onHyperLinkMouseOut: PropTypes.func,
};

export default Row;