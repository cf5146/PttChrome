import React from "react";
import PropTypes from "prop-types";
import { compose, lifecycle } from "recompose";
import { Alert, Button } from "react-bootstrap";
import { i18n } from "../js/i18n";
import "./PageTopAlert.css";

const enhance = compose(
  lifecycle({
    componentDidMount() {
      this.handler = e => {
        if (e.keyCode == 13) {
          this.props.onDismiss();
        }
        // Kills everything becase we don't want any further action performed under ConnectionAlert status
        e.preventDefault();
        e.stopImmediatePropagation();
      };
      globalThis.addEventListener("keydown", this.handler, true);
    },
    componentWillUnmount() {
      globalThis.removeEventListener("keydown", this.handler, true);
    }
  })
);

export const ConnectionAlert = ({ onDismiss }) => (
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

ConnectionAlert.propTypes = {
  onDismiss: PropTypes.func.isRequired
};

export default enhance(ConnectionAlert);
