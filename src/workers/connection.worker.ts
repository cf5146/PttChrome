/// <reference lib="webworker" />

type WorkerCommand =
  | {
      type: 'CONNECT';
      payload: {
        url: string;
      };
    }
  | {
      type: 'SEND';
      payload: ArrayBuffer;
    }
  | {
      type: 'SET_ANTI_IDLE_TIME';
      payload: {
        milliseconds: number;
      };
    }
  | {
      type: 'CLOSE';
    };

const ANTI_IDLE_INTERVAL_MS = 1000;
const ANTI_IDLE_PAYLOAD = new Uint8Array([0x1b, 0x1b]);

let socket: WebSocket | null = null;
let antiIdleTime = 0;
let idleTime = 0;
let antiIdleTimer: ReturnType<typeof globalThis.setInterval> | null = null;

const workerScope = globalThis as unknown as DedicatedWorkerGlobalScope;

const stopAntiIdleTimer = () => {
  if (antiIdleTimer !== null) {
    clearInterval(antiIdleTimer);
    antiIdleTimer = null;
  }
};

const resetIdleState = () => {
  idleTime = 0;
};

const startAntiIdleTimer = () => {
  if (antiIdleTimer !== null) {
    return;
  }

  antiIdleTimer = globalThis.setInterval(() => {
    if (socket?.readyState !== WebSocket.OPEN) {
      return;
    }

    if (antiIdleTime && idleTime > antiIdleTime) {
      socket.send(ANTI_IDLE_PAYLOAD);
      resetIdleState();
      return;
    }

    idleTime += ANTI_IDLE_INTERVAL_MS;
  }, ANTI_IDLE_INTERVAL_MS);
};

const disconnectSocket = (notifyClose: boolean) => {
  stopAntiIdleTimer();
  resetIdleState();

  if (!socket) {
    if (notifyClose) {
      workerScope.postMessage({ type: 'CLOSE' });
    }
    return;
  }

  const currentSocket = socket;
  socket = null;
  currentSocket.onopen = null;
  currentSocket.onmessage = null;
  currentSocket.onerror = null;
  currentSocket.onclose = null;

  if (
    currentSocket.readyState === WebSocket.OPEN
    || currentSocket.readyState === WebSocket.CONNECTING
  ) {
    currentSocket.close();
  }

  if (notifyClose) {
    workerScope.postMessage({ type: 'CLOSE' });
  }
};

const connectToServer = (url: string) => {
  disconnectSocket(false);

  const currentSocket = new WebSocket(url);
  currentSocket.binaryType = 'arraybuffer';
  socket = currentSocket;

  currentSocket.onopen = () => {
    if (socket !== currentSocket) {
      return;
    }

    resetIdleState();
    startAntiIdleTimer();
    workerScope.postMessage({ type: 'OPEN' });
  };

  currentSocket.onmessage = event => {
    if (socket !== currentSocket) {
      return;
    }

    if (event.data instanceof ArrayBuffer) {
      workerScope.postMessage(
        {
          type: 'DATA',
          payload: event.data
        },
        [event.data]
      );
      return;
    }

    workerScope.postMessage({
      type: 'ERROR',
      payload: 'Unexpected websocket payload type'
    });
  };

  currentSocket.onerror = () => {
    if (socket !== currentSocket) {
      return;
    }

    workerScope.postMessage({ type: 'ERROR' });
  };

  currentSocket.onclose = () => {
    if (socket !== currentSocket) {
      return;
    }

    stopAntiIdleTimer();
    resetIdleState();
    socket = null;
    workerScope.postMessage({ type: 'CLOSE' });
  };
};

const updateAntiIdleTime = (milliseconds: number) => {
  antiIdleTime = Number.isFinite(milliseconds) && milliseconds > 0
    ? milliseconds
    : 0;

  if (!antiIdleTime) {
    resetIdleState();
  }
};

workerScope.onmessage = (event: MessageEvent<WorkerCommand>) => {
  const { data } = event;

  switch (data.type) {
    case 'CONNECT':
      connectToServer(data.payload.url);
      break;
    case 'SEND':
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(data.payload);
      }
      break;
    case 'SET_ANTI_IDLE_TIME':
      updateAntiIdleTime(data.payload.milliseconds);
      break;
    case 'CLOSE':
      disconnectSocket(true);
      break;
    default:
      break;
  }
};
