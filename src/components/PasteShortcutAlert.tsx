import React from 'react';
import { Alert, Button } from 'react-bootstrap';
import { i18n } from '../js/i18n';
import './PageTopAlert.css';

export interface PasteShortcutAlertProps {
  onDismiss: () => void;
}

export const PasteShortcutAlert: React.FC<PasteShortcutAlertProps> = ({ onDismiss }) => (
  <Alert
    variant="info"
    className="PageTopAlert"
    tabIndex={-1}
    onClose={onDismiss}
    dismissible
  >
    <h4>{i18n('alert_pasteShortcutHeader')}</h4>
    <p>{i18n('alert_pasteShortcutText')}</p>
    <p>
      <Button variant="primary" onClick={onDismiss}>
        {i18n('alert_pasteShortcutClose')}
      </Button>
    </p>
  </Alert>
);

export default PasteShortcutAlert;
