# Code Examples

## Cloudflare Worker Proxy

Use this when a browser-hosted frontend must connect to PTT through a relay that rewrites the upgrade request.

```javascript
export default {
  async fetch(request) {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('This is a WebSocket proxy for PTT.', { status: 400 });
    }

    // Cloudflare fetch uses an https URL while preserving the WebSocket upgrade.
    const targetUrl = 'https://ws.ptt.cc/bbs';
    const modifiedRequest = new Request(targetUrl, request);

    modifiedRequest.headers.set('Origin', 'https://term.ptt.cc');
    modifiedRequest.headers.set('Host', 'ws.ptt.cc');

    return fetch(modifiedRequest);
  },
};
```

## Browser Frontend Example

Point the browser at the Worker URL instead of the direct PTT endpoint.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>PTT Proxy Client</title>
</head>
<body>
  <div id="terminal"></div>

  <script>
    const terminalOutput = document.getElementById('terminal');
    const proxyUrl = 'wss://ptt-proxy.<your-username>.workers.dev';
    const pttSocket = new WebSocket(proxyUrl);

    pttSocket.binaryType = 'arraybuffer';

    pttSocket.onmessage = function onMessage(event) {
      const decoder = new TextDecoder('big5');
      const decodedText = decoder.decode(event.data);

      console.log(decodedText);
      terminalOutput.innerText += decodedText;
    };
  </script>
</body>
</html>
```

## Next Layer After Transport Works

Once the socket opens and bytes flow through the proxy, move on to these concerns in order:

1. Telnet protocol negotiation
2. ANSI escape sequence parsing
3. Big5 decoding edge cases and character width handling
4. Keyboard input and terminal interaction mapping
5. Screen buffering and terminal UI rendering
