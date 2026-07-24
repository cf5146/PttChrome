export const RESOURCE_LIMITS = {
  maxTermCols: 1000,
  maxTermRows: 1000,
  maxEscapeSequenceLength: 4096,
  maxConnectionMessageBytes: 1024 * 1024,
  maxExternalUrlLength: 4096,
  maxInputHelperLength: 8192,
  maxReconnectAttempts: 3,
  maxPreviewRequests: 8
} as const;

export const RECONNECT_DELAYS_MS = [3000, 6000, 12000] as const;
