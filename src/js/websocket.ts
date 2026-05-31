import { Event } from './event';
import type { ConnectionDataDetail, TerminalSocket } from '../types/connection';

export interface Websocket extends TerminalSocket {
  _conn: WebSocket;
  dispatchEvent(e: CustomEvent): void;
  _onOpen(e: unknown): void;
  _onMessage(e: MessageEvent<ArrayBuffer>): void;
  _onError(e: unknown): void;
  _onClose(e: unknown): void;
}

export function Websocket(this: Websocket, url: string) {
  this._conn = new WebSocket(url);
  this._conn.binaryType = 'arraybuffer';
  this._conn.addEventListener('open', this._onOpen.bind(this));
  this._conn.addEventListener('message', this._onMessage.bind(this));
  this._conn.addEventListener('error', this._onError.bind(this));
  this._conn.addEventListener('close', this._onClose.bind(this));
}

Event.mixin(Websocket.prototype);

Websocket.prototype._onOpen = function(_e: unknown) {
  this.dispatchEvent(new CustomEvent('open'));
};

Websocket.prototype._onMessage = function(e: MessageEvent<ArrayBuffer>) {
  const data = new Uint8Array(e.data);
  this.dispatchEvent(new CustomEvent('data', {
    detail: {
      data: String.fromCodePoint(...Array.from(data))
    } satisfies ConnectionDataDetail
  }));
};

Websocket.prototype._onError = function(_e: unknown) {
  this.dispatchEvent(new CustomEvent('error'));
};

Websocket.prototype._onClose = function(_e: unknown) {
  this.dispatchEvent(new CustomEvent('close'));
};

Websocket.prototype.send = function(str: string) {
  // XXX: move this to app.
  // because ptt seems to reponse back slowly after large
  // chunk of text is pasted, so better to split it up.
  const chunk = 1000;
  for (let i = 0; i < str.length; i += chunk) {
    const chunkStr = str.substring(i, i + chunk);
    const byteArray = new Uint8Array(
      chunkStr.split('').map(x => x.codePointAt(0) ?? 0)
    );
    this._conn.send(byteArray.buffer);
  }
};

Websocket.prototype.close = function() {
  this._conn.close();
};
