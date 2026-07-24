import type { ConnectionConfig, ProtocolType } from '../types/connection';

const PROTOCOL_CONFIG: Record<ProtocolType, { socketProtocol: 'ws' | 'wss'; defaultPort: number }> = {
  wstelnet: { socketProtocol: 'ws', defaultPort: 80 },
  wsstelnet: { socketProtocol: 'wss', defaultPort: 443 }
};

const MAX_CONNECTION_URL_LENGTH = 4096;

const isProtocolType = (protocol: string): protocol is ProtocolType =>
  protocol in PROTOCOL_CONFIG;

const formatSocketHostname = (hostname: string) =>
  hostname.includes(':') && !hostname.startsWith('[')
    ? `[${hostname}]`
    : hostname;

export const parseConnectionUrl = (
  value: unknown
): ConnectionConfig | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const input = value.trim();
  if (
    !input ||
    input.length > MAX_CONNECTION_URL_LENGTH ||
    /[\u0000-\u001f\u007f]/.test(input) ||
    /%00/i.test(input)
  ) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    return null;
  }

  const protocol = parsed.protocol.slice(0, -1);
  if (!isProtocolType(protocol)) {
    return null;
  }

  if (
    !parsed.hostname ||
    parsed.username ||
    parsed.password ||
    parsed.hash
  ) {
    return null;
  }

  const { socketProtocol, defaultPort } = PROTOCOL_CONFIG[protocol];
  const port = parsed.port ? Number.parseInt(parsed.port, 10) : defaultPort;
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return null;
  }

  const path = `${parsed.pathname || '/'}${parsed.search}`;
  const socketHostname = formatSocketHostname(parsed.hostname);
  const socketPort = parsed.port ? `:${port}` : '';

  return {
    url: parsed.toString(),
    protocol,
    hostname: parsed.hostname,
    port,
    path,
    socketUrl: `${socketProtocol}://${socketHostname}${socketPort}${path}`,
    easyReadingSupported: true
  };
};

export const getSafeConnectionUrl = (value: unknown): string | null =>
  parseConnectionUrl(value)?.url ?? null;
