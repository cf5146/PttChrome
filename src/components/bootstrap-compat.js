/* eslint-disable react/prop-types */

import React from "react";
import cx from "classnames";
import {
  Alert as BootstrapAlert,
  Button as BootstrapButton,
  Form,
  Nav as BootstrapNav,
  Popover as BootstrapPopover,
  Tooltip as BootstrapTooltip
} from "react-bootstrap";

const variantByBsStyle = {
  default: "secondary",
  primary: "primary",
  success: "success",
  info: "info",
  warning: "warning",
  danger: "danger",
  link: "link"
};

const normalizeVariant = value => {
  if (!value) {
    return undefined;
  }

  return variantByBsStyle[value] || value;
};

export const Alert = ({ bsStyle, onDismiss, dismissible, ...props }) => (
  <BootstrapAlert
    variant={normalizeVariant(bsStyle)}
    dismissible={dismissible || !!onDismiss}
    onClose={onDismiss}
    {...props}
  />
);

export const Button = ({ bsStyle, variant, ...props }) => (
  <BootstrapButton variant={variant || normalizeVariant(bsStyle)} {...props} />
);

export const Nav = ({ bsStyle, stacked, className, ...props }) => (
  <BootstrapNav
    variant={bsStyle}
    className={cx(className, {
      "flex-column": stacked
    })}
    {...props}
  />
);

export const NavItem = ({ children, ...props }) => (
  <BootstrapNav.Item>
    <BootstrapNav.Link {...props}>{children}</BootstrapNav.Link>
  </BootstrapNav.Item>
);

export const Checkbox = ({ children, ...props }) => (
  <Form.Check type="checkbox" label={children} {...props} />
);

export const FormGroup = Form.Group;
export const ControlLabel = Form.Label;

export const FormControl = React.forwardRef(
  ({ componentClass, as, ...props }, ref) => (
    <Form.Control ref={ref} as={componentClass || as} {...props} />
  )
);

FormControl.displayName = "FormControl";

export const Tooltip = ({ id, children, ...props }) => (
  <BootstrapTooltip id={id || "tooltip"} {...props}>
    {children}
  </BootstrapTooltip>
);

export const Popover = ({ id, children, ...props }) => (
  <BootstrapPopover id={id || "popover"} {...props}>
    <BootstrapPopover.Body>{children}</BootstrapPopover.Body>
  </BootstrapPopover>
);

export {
  Col,
  Dropdown,
  Fade,
  Modal,
  NavDropdown,
  OverlayTrigger,
  Row,
  SplitButton,
  Tab
} from "react-bootstrap";
