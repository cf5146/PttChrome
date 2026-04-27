import { Event } from './event';

function binaryStringToArrayBuffer(str) {
  const bytes = new Uint8Array(str.length);

  for (let i = 0; i < str.length; i++) {
    bytes[i] = str.codePointAt(i);
  }

  return bytes.buffer;
}

function arrayBufferToBinaryString(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let result = '';

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    result += String.fromCodePoint(...chunk);
  }

  return result;
}

export function WorkerWebsocket(url) {
  this.handlesAntiIdle = true;
  this._worker = new Worker(
    new URL('../workers/connection.worker.ts', import.meta.url),
    { type: 'module' }
  );
  this._onWorkerMessage = this._handleWorkerMessage.bind(this);
  this._onWorkerError = this._handleWorkerError.bind(this);

  this._worker.addEventListener('message', this._onWorkerMessage);
  this._worker.addEventListener('error', this._onWorkerError);
  this._postMessage('CONNECT', { url: url });
}

Event.mixin(WorkerWebsocket.prototype);

WorkerWebsocket.prototype._postMessage = function(type, payload, transferList) {
  if (!this._worker) {
    return;
  }

  if (transferList && transferList.length > 0) {
    this._worker.postMessage({ type, payload }, transferList);
    return;
  }

  this._worker.postMessage({ type, payload });
};

WorkerWebsocket.prototype._handleWorkerMessage = function(e) {
  const message = e.data;

  switch (message.type) {
    case 'OPEN':
      this.dispatchEvent(new CustomEvent('open'));
      break;
    case 'DATA':
      this.dispatchEvent(new CustomEvent('data', {
        detail: {
          data: arrayBufferToBinaryString(message.payload)
        }
      }));
      break;
    case 'ERROR':
      this.dispatchEvent(new CustomEvent('error'));
      break;
    case 'CLOSE':
      this.dispatchEvent(new CustomEvent('close'));
      this.dispose();
      break;
    default:
      break;
  }
};

WorkerWebsocket.prototype._handleWorkerError = function() {
  this.dispatchEvent(new CustomEvent('error'));
};

WorkerWebsocket.prototype.send = function(str) {
  const payload = binaryStringToArrayBuffer(str);
  this._postMessage('SEND', payload, [payload]);
};

WorkerWebsocket.prototype.setAntiIdleTime = function(milliseconds) {
  this._postMessage('SET_ANTI_IDLE_TIME', { milliseconds: milliseconds });
};

WorkerWebsocket.prototype.close = function() {
  this._postMessage('CLOSE');
};

WorkerWebsocket.prototype.dispose = function() {
  if (!this._worker) {
    return;
  }

  this._worker.removeEventListener('message', this._onWorkerMessage);
  this._worker.removeEventListener('error', this._onWorkerError);
  this._worker.terminate();
  this._worker = null;
};
