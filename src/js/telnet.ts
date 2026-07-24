// Handle Telnet Connections according to RFC 854

import { Event } from './event';
import { u2b, ansiHalfColorConv } from './string_util';
import type {
  ConnectionDataDetail,
  TerminalConnection,
  TerminalSocket
} from '../types/connection';

type TelnetState = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// Telnet commands
const SE = '\xf0';
const NOP = '\xf1';
const DATA_MARK = '\xf2';
const BREAK = '\xf3';
const INTERRUPT_PROCESS = '\xf4';
const ABORT_OUTPUT = '\xf5';
const ARE_YOU_THERE = '\xf6';
const ERASE_CHARACTER = '\xf7';
const ERASE_LINE = '\xf8';
const GO_AHEAD  = '\xf9';
const SB = '\xfa';

// Option commands
const WILL  = '\xfb';
const WONT  = '\xfc';
const DO = '\xfd';
const DONT = '\xfe';
const IAC = '\xff';

// Telnet options
const ECHO  = '\x01';
const SUPRESS_GO_AHEAD = '\x03';
const TERM_TYPE = '\x18';
const IS = '\x00';
const SEND = '\x01';
const NAWS = '\x1f';

// state
const STATE_DATA = 0;
const STATE_IAC = 1;
const STATE_WILL = 2;
const STATE_WONT = 3;
const STATE_DO = 4;
const STATE_DONT = 5;
const STATE_SB = 6;

export interface TelnetConnection extends TerminalConnection {
  socket: TerminalSocket;
  state: TelnetState;
  iac_sb: string;
  termType: string;
  isConnected?: boolean;
  dispatchEvent(e: CustomEvent): void;
  _onOpen(e: unknown): void;
  _onError(e: unknown): void;
  _onClose(e: unknown): void;
  _onDataAvailable(e: CustomEvent<ConnectionDataDetail>): void;
  _handleTelnetChar(ch: string, data: string): string;
  _handleDataState(ch: string, data: string): string;
  _handleIacState(ch: string): void;
  _handleWillState(ch: string): void;
  _handleDoState(ch: string): void;
  _handleSubnegotiationState(ch: string): void;
  _dispatchData(data: string): void;
  _sendRaw(data: string): void;
}

export function TelnetConnection(this: TelnetConnection, socket: TerminalSocket) {
  this.socket = socket;
  this.socket.addEventListener('open', this._onOpen.bind(this));
  this.socket.addEventListener('data', this._onDataAvailable.bind(this));
  this.socket.addEventListener('error', this._onError.bind(this));
  this.socket.addEventListener('close', this._onClose.bind(this));

  this.state = STATE_DATA;
  this.iac_sb = '';

  this.termType = 'VT100';
}

Event.mixin(TelnetConnection.prototype);

TelnetConnection.prototype._onOpen = function(_e: unknown) {
  this.dispatchEvent(new CustomEvent('open'));
};

TelnetConnection.prototype._onError = function(_e: unknown) {
  this.dispatchEvent(new CustomEvent('error'));
};

TelnetConnection.prototype._onClose = function(_e: unknown) {
  this.dispatchEvent(new CustomEvent('close'));
};

TelnetConnection.prototype._onDataAvailable = function(e: CustomEvent<ConnectionDataDetail>) {
  const str = e.detail.data;
  let data = '';

  for (const ch of str) {
    data = this._handleTelnetChar(ch, data);
  }

  if (data) {
    this._dispatchData(data);
  }
};

TelnetConnection.prototype._handleTelnetChar = function(ch: string, data: string) {
  switch (this.state) {
  case STATE_DATA:
    return this._handleDataState(ch, data);
  case STATE_IAC:
    this._handleIacState(ch);
    return data;
  case STATE_WILL:
    this._handleWillState(ch);
    return data;
  case STATE_DO:
    this._handleDoState(ch);
    return data;
  case STATE_SB:
    this._handleSubnegotiationState(ch);
    return data;
  case STATE_DONT:
  case STATE_WONT:
  default:
    this.state = STATE_DATA;
    return data;
  }
};

TelnetConnection.prototype._handleDataState = function(ch: string, data: string) {
  if (ch == IAC) {
    if (data) {
      this._dispatchData(data);
    }
    this.state = STATE_IAC;
    return '';
  }

  return data + ch;
};

TelnetConnection.prototype._handleIacState = function(ch: string) {
  switch (ch) {
  case WILL:
    this.state = STATE_WILL;
    break;
  case WONT:
    this.state = STATE_WONT;
    break;
  case DO:
    this.state = STATE_DO;
    break;
  case DONT:
    this.state = STATE_DONT;
    break;
  case SB:
    this.state = STATE_SB;
    break;
  default:
    this.state = STATE_DATA;
  }
};

TelnetConnection.prototype._handleWillState = function(ch: string) {
  switch (ch) {
  case ECHO:
  case SUPRESS_GO_AHEAD:
    this._sendRaw( IAC + DO + ch );
    break;
  default:
    this._sendRaw( IAC + DONT + ch );
  }
  this.state = STATE_DATA;
};

TelnetConnection.prototype._handleDoState = function(ch: string) {
  if (ch == TERM_TYPE) {
    this._sendRaw( IAC + WILL + ch );
  } else if (ch == NAWS) {
    this.dispatchEvent(new CustomEvent('doNaws'));
  } else {
    this._sendRaw( IAC + WONT + ch );
  }
  this.state = STATE_DATA;
};

TelnetConnection.prototype._handleSubnegotiationState = function(ch: string) {
  this.iac_sb += ch;
  if (this.iac_sb.slice(-2) != IAC + SE) {
    return;
  }

  if (this.iac_sb[0] == TERM_TYPE) {
    const rep = IAC + SB + TERM_TYPE + IS + this.termType + IAC + SE;
    this._sendRaw( rep );
  }
  this.state = STATE_DATA;
  this.iac_sb = '';
};

TelnetConnection.prototype._dispatchData = function(data: string) {
  this.dispatchEvent(new CustomEvent('data', {
    detail: {
      data
    }
  }));
};

TelnetConnection.prototype.send = function(str: string) {
  // XXX Should do escape on IAC.
  this._sendRaw(str);
};

TelnetConnection.prototype._sendRaw = function(data: string) {
  if (data) {
    this.socket.send(data);
  }
};

TelnetConnection.prototype.close = function() {
  if (this.socket.close) {
    this.socket.close();
  }
};

TelnetConnection.prototype.convSend = function(unicode_str: string) {
  // supports UAO
  // when converting unicode to big5, use UAO.

  let s = u2b(unicode_str);
  // detect ;50m (half color) and then convert accordingly
  if (s) {
    s = ansiHalfColorConv(s);
    this._sendRaw(s);
  }
};

TelnetConnection.prototype.sendWillNaws = function(_cols: number, _rows: number) {
  this._sendRaw(IAC + WILL + NAWS);
};

TelnetConnection.prototype.sendNaws = function(cols: number, rows: number) {
  const nawsStr = String.fromCodePoint(
    Math.floor(cols / 256),
    cols % 256,
    Math.floor(rows / 256),
    rows % 256
  ).replace(/(\xff)/g, '\xff\xff');
  const rep = IAC + SB + NAWS + nawsStr + IAC + SE;
  this._sendRaw( rep );
};
