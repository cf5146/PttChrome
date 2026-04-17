import React from "react";
import PropTypes from "prop-types";
import { Alert, Button } from "react-bootstrap";
import { i18n } from "../js/i18n";
import "./PageTopAlert.css";

export const DeveloperModeAlert = ({ onDismiss }) => (
  <Alert bsStyle="danger" className="PageTopAlert" onDismiss={onDismiss}>
    <h4>{i18n("alert_developerModeHeader")}</h4>
    <p>{i18n("alert_developerModeText")}</p>
    <p>
      <Button bsStyle="danger" onClick={onDismiss}>
        {i18n("alert_developerModeDismiss")}
      </Button>
    </p>
  </Alert>
);

DeveloperModeAlert.propTypes = {
  onDismiss: PropTypes.func.isRequired
};

export default DeveloperModeAlert;
