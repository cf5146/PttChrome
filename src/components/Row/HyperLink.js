import PropTypes from "prop-types";
import { getSafeExternalUrl } from "../../js/util";

export const HyperLink = ({
  col,
  row,
  href,
  inner,
  onMouseOver,
  onMouseOut
}) => {
  const safeHref = getSafeExternalUrl(href);

  if (!safeHref) {
    return (
      <span className="y" data-scol={col} data-srow={row}>
        {inner}
      </span>
    );
  }

  return (
    <a
      onMouseOver={onMouseOver}
      onMouseOut={onMouseOut}
      onFocus={onMouseOver}
      onBlur={onMouseOut}
      data-scol={col}
      data-srow={row}
      className="y"
      href={safeHref}
      rel="noopener noreferrer"
      target="_blank"
    >
      {inner}
    </a>
  );
};

HyperLink.propTypes = {
  col: PropTypes.number.isRequired,
  row: PropTypes.number.isRequired,
  href: PropTypes.string,
  inner: PropTypes.node.isRequired,
  onMouseOver: PropTypes.func,
  onMouseOut: PropTypes.func
};

export default HyperLink;
