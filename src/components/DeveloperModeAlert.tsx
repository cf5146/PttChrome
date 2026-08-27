import React from 'react';
import { Alert, Button } from 'react-bootstrap';
import { i18n } from '../js/i18n';
import './PageTopAlert.css';

export interface DeveloperModeAlertProps {
  onDismiss: () => void;
}

export const DeveloperModeAlert: React.FC<DeveloperModeAlertProps> = ({ onDismiss }) => (
  <Alert variant="danger" className="PageTopAlert" onClose={onDismiss} dismissible>
    <h4>{i18n('alert_developerModeHeader')}</h4>
    <p>{i18n('alert_developerModeText')}</p>
    <p>
      <Button variant="danger" onClick={onDismiss}>
        {i18n('alert_developerModeDismiss')}
      </Button>
    </p>
  </Alert>
);

export default DeveloperModeAlert;
