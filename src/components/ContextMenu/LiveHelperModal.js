import React from "react";
import { Modal, OverlayTrigger, Tooltip, Button } from "../bootstrap-compat";
import { i18n } from "../../js/i18n";
import "./LiveHelperModal.css";

const normalizeSec = value => {
  const sec = Number.parseInt(value, 10);
  return Math.max(sec, 1);
};

export const LiveHelperModal = ({ show, onHide, enabled, sec, onChange }) => {
  const onEnabledClick = () => {
    onChange({ enabled: !enabled, sec });
  };

  const onSecChange = ({ target: { value } }) => {
    onChange({ enabled, sec: normalizeSec(value) });
  };

  return (
    <Modal show={show} onHide={onHide} backdrop={false}>
      <Modal.Body className="LiveHelperModal__Body">
        <OverlayTrigger
          placement="top"
          overlay={<Tooltip id="live-helper-hotkey">Alt + r</Tooltip>}
        >
          <Button active={enabled} onClick={onEnabledClick}>
            {i18n("liveHelperEnable")}
          </Button>
        </OverlayTrigger>
        <span className="LiveHelperModal__Body__Text nomouse_command">
          {i18n("liveHelperSpan")}
        </span>
        <input
          type="number"
          className="LiveHelperModal__Body__Input form-control nomouse_command"
          value={sec}
          onChange={onSecChange}
        />
        <span className="LiveHelperModal__Body__Text nomouse_command">
          {i18n("liveHelperSpanSec")}
        </span>
        <button
          type="button"
          className="LiveHelperModal__Body__Close close nomouse_command"
          onClick={onHide}
        >
          &times;
        </button>
      </Modal.Body>
    </Modal>
  );
};

export default LiveHelperModal;
