import React from 'react';
import { Modal } from 'react-bootstrap';
import {
  useAppRuntimeStore,
  writeRuntimeAlert,
  writeRuntimeModalOpen
} from '../store';
import ConnectionAlert from './ConnectionAlert';
import DeveloperModeAlert from './DeveloperModeAlert';
import PasteShortcutAlert from './PasteShortcutAlert';

export interface AppAlertAppTarget {
  reconnect: () => void;
  setInputAreaFocus: () => void;
}

export interface AppAlertHostProps {
  app: AppAlertAppTarget;
}

export const AppAlertHost: React.FC<AppAlertHostProps> = ({ app }) => {
  const activeAlert = useAppRuntimeStore(state => state.activeAlert);

  const hideAlert = React.useCallback(() => {
    writeRuntimeAlert(null);
  }, []);

  const onReconnect = React.useCallback(() => {
    hideAlert();
    app.reconnect();
  }, [app, hideAlert]);

  const onPasteShortcutDismiss = React.useCallback(() => {
    writeRuntimeModalOpen(false);
    hideAlert();
    app.setInputAreaFocus();
  }, [app, hideAlert]);

  switch (activeAlert) {
    case 'connection':
      return <ConnectionAlert onDismiss={onReconnect} />;
    case 'developerMode':
      return <DeveloperModeAlert onDismiss={hideAlert} />;
    case 'pasteShortcut':
      return (
        <Modal
          show
          onHide={onPasteShortcutDismiss}
          backdrop="static"
          keyboard={false}
          centered
        >
          <Modal.Body className="p-0">
            <PasteShortcutAlert onDismiss={onPasteShortcutDismiss} />
          </Modal.Body>
        </Modal>
      );
    default:
      return null;
  }
};

export default AppAlertHost;
