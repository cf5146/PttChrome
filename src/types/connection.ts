export type ProtocolType = 'wstelnet' | 'wsstelnet';

export type ConnectionStatusCode = 0 | 1 | 2;

export type ConnectionConfig = {
  url: string;
  protocol: ProtocolType;
  hostname: string;
  port: number;
  path: string;
  socketUrl: string;
  easyReadingSupported: boolean;
};

export type ConnectedUrl = {
  url: string;
  site: string;
  port: number;
  easyReadingSupported: boolean;
};

export type RuntimeAlertKind = 'connection' | 'developerMode' | 'pasteShortcut' | null;

export type ConnectionState = {
  connectState: ConnectionStatusCode;
  connectedUrl: ConnectedUrl;
  activeAlert: RuntimeAlertKind;
};

export type ConnectionDataDetail = {
  data: string;
};

export type ConnectionEvents = {
  open: CustomEvent<void>;
  data: CustomEvent<ConnectionDataDetail>;
  close: CustomEvent<void>;
  error: CustomEvent<void>;
  doNaws: CustomEvent<void>;
};

export type ConnectionEventName = keyof ConnectionEvents;

export interface TerminalConnection {
  addEventListener<Name extends ConnectionEventName>(
    name: Name,
    listener: (event: ConnectionEvents[Name]) => void
  ): void;
  removeEventListener?<Name extends ConnectionEventName>(
    name: Name,
    listener: (event: ConnectionEvents[Name]) => void
  ): void;
  send(data: string): void;
  convSend?(data: string): void;
  close?(): void;
  sendWillNaws?(cols: number, rows: number): void;
  sendNaws?(cols: number, rows: number): void;
}

export interface TerminalSocket {
  addEventListener(
    name: 'open' | 'data' | 'close' | 'error',
    listener: (event: CustomEvent<ConnectionDataDetail> | Event) => void
  ): void;
  send(data: string): void;
  close?(): void;
}