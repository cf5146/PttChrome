import React from "react";
import PropTypes from "prop-types";
import { Alert, Button } from "./bootstrap-compat";
import { i18n } from "../js/i18n";
import "./PageTopAlert.css";

export const ConnectionAlert = ({ onDismiss }) => {
  React.useEffect(() => {
    const handler = e => {
      if (e.keyCode == 13) {
        onDismiss();
      }
      // Kills everything becase we don't want any further action performed under ConnectionAlert status
      e.preventDefault();
      e.stopImmediatePropagation();
    };

    globalThis.addEventListener("keydown", handler, true);

    return () => {
      globalThis.removeEventListener("keydown", handler, true);
    };
  }, [onDismiss]);

  return (
    <Alert bsStyle="danger" className="PageTopAlert" onDismiss={onDismiss}>
      <h4>{i18n("alert_connectionHeader")}</h4>
      <p>{i18n("alert_connectionText")}</p>
      <p>
        <Button bsStyle="danger" onClick={onDismiss}>
          {i18n("alert_connectionReconnect")}
        </Button>
      </p>
    </Alert>
  );
};

ConnectionAlert.propTypes = {
  onDismiss: PropTypes.func.isRequired
};

export default ConnectionAlert;
