import React from 'react';
import { Modal, OverlayTrigger, Tooltip, Button } from 'react-bootstrap';
import { i18n } from '../../js/i18n';
import './LiveHelperModal.css';

export interface LiveHelperModalProps {
  show: boolean;
  onHide: () => void;
  enabled: boolean;
  sec: number;
  onChange: (next: { enabled: boolean; sec: number }) => void;
}

const normalizeSec = (value: string): number => {
  const sec = Number.parseInt(value, 10);
  return Math.max(Number.isNaN(sec) ? 1 : sec, 1);
};

export const LiveHelperModal: React.FC<LiveHelperModalProps> = ({
  show,
  onHide,
  enabled,
  sec,
  onChange
}) => {
  const onEnabledClick = () => {
    onChange({ enabled: !enabled, sec });
  };

  const onSecChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ enabled, sec: normalizeSec(event.target.value) });
  };

  return (
    <Modal show={show} onHide={onHide} backdrop={false}>
      <Modal.Body className="LiveHelperModal__Body">
        <OverlayTrigger
          placement="top"
          overlay={<Tooltip id="live-helper-hotkey">Alt + r</Tooltip>}
        >
          <Button
            active={enabled}
            variant={enabled ? 'primary' : 'secondary'}
            onClick={onEnabledClick}
          >
            {i18n('liveHelperEnable')}
          </Button>
        </OverlayTrigger>
        <span className="LiveHelperModal__Body__Text nomouse_command">
          {i18n('liveHelperSpan')}
        </span>
        <input
          type="number"
          className="LiveHelperModal__Body__Input form-control nomouse_command"
          value={sec}
          onChange={onSecChange}
        />
        <span className="LiveHelperModal__Body__Text nomouse_command">
          {i18n('liveHelperSpanSec')}
        </span>
        <button
          type="button"
          className="LiveHelperModal__Body__Close close nomouse_command"
          onClick={onHide}
          aria-label="Close"
        >
          &times;
        </button>
      </Modal.Body>
    </Modal>
  );
};

export default LiveHelperModal;
