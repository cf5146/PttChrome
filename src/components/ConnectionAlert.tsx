import React from 'react';
import { Alert, Button } from 'react-bootstrap';
import { i18n } from '../js/i18n';
import './PageTopAlert.css';

export interface ConnectionAlertProps {
  onDismiss: () => void;
}

export const ConnectionAlert: React.FC<ConnectionAlertProps> = ({ onDismiss }) => {
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.code === 'Enter') {
        onDismiss();
      }
      // Kills everything because we don't want any further action performed under ConnectionAlert status
      e.preventDefault();
      e.stopImmediatePropagation();
    };

    globalThis.addEventListener('keydown', handler, true);

    return () => {
      globalThis.removeEventListener('keydown', handler, true);
    };
  }, [onDismiss]);

  return (
    <Alert variant="danger" className="PageTopAlert" onClose={onDismiss} dismissible>
      <h4>{i18n('alert_connectionHeader')}</h4>
      <p>{i18n('alert_connectionText')}</p>
      <p>
        <Button variant="danger" onClick={onDismiss}>
          {i18n('alert_connectionReconnect')}
        </Button>
      </p>
    </Alert>
  );
};

export default ConnectionAlert;
