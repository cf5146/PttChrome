const DEFAULT_UPSTREAM_HTTP_URL = 'https://ws.ptt.cc/bbs';
const DEFAULT_UPSTREAM_ORIGIN = 'https://term.ptt.cc';
const DEFAULT_ALLOWED_ORIGIN = 'https://robertabcd.github.io';

function closeSocket(socket, code, reason) {
  try {
    socket.close(code, reason);
  } catch (error) {
    console.debug('closeSocket ignored', error);
  }
}

function bindSocket(source, target) {
  source.addEventListener('message', (event) => {
    try {
      target.send(event.data);
    } catch (error) {
      console.error('relay send failed', error);
      closeSocket(target, 1011, 'Relay send failed');
    }
  });

  source.addEventListener('close', (event) => {
    closeSocket(target, event.code || 1000, event.reason || 'Peer closed');
  });

  source.addEventListener('error', () => {
    closeSocket(target, 1011, 'Relay error');
  });
}

async function connectUpstream(env) {
  const upstreamUrl = env.UPSTREAM_HTTP_URL || DEFAULT_UPSTREAM_HTTP_URL;
  const upstreamOrigin = env.UPSTREAM_ORIGIN || DEFAULT_UPSTREAM_ORIGIN;
  const response = await fetch(upstreamUrl, {
    headers: {
      Upgrade: 'websocket',
      Origin: upstreamOrigin,
    },
  });

  if (!response.webSocket) {
    throw new Error(`Upstream rejected the websocket handshake: ${response.status}`);
  }

  response.webSocket.accept();
  return response.webSocket;
}

export default {
  async fetch(request, env) {
    const requestUrl = new URL(request.url);
    const upgradeHeader = request.headers.get('Upgrade');
    const allowedOrigin = env.ALLOWED_ORIGIN || DEFAULT_ALLOWED_ORIGIN;
    const requestOrigin = request.headers.get('Origin');

    if (requestUrl.pathname !== '/bbs') {
      return new Response('Not Found', { status: 404 });
    }

    if (upgradeHeader?.toLowerCase() !== 'websocket') {
      return new Response('Expected Upgrade: websocket', { status: 426 });
    }

    if (allowedOrigin && requestOrigin !== allowedOrigin) {
      return new Response('Forbidden', { status: 403 });
    }

    let upstreamSocket;
    try {
      upstreamSocket = await connectUpstream(env);
    } catch (error) {
      return new Response(`Failed to connect upstream: ${error.message}`, { status: 502 });
    }

    const [clientSocket, workerSocket] = Object.values(new WebSocketPair());
    workerSocket.accept();

    bindSocket(workerSocket, upstreamSocket);
    bindSocket(upstreamSocket, workerSocket);

    return new Response(null, {
      status: 101,
      webSocket: clientSocket,
    });
  },
};