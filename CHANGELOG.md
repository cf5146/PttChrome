# Changelog

All notable changes to PttChrome are documented here.

## Unreleased

### Security

- Treat terminal output and external preview URLs as untrusted input.
- Reject unsafe navigation and image-preview URLs, including embedded credentials and non-HTTPS preview sources.
- Remove the browser-bundled Flickr provider credential path.
- Add CSP, source-safety checks, and a private security-reporting policy.

### Reliability

- Add explicit connection lifecycle state and session-scoped event handling.
- Add bounded reconnect attempts and explicit disconnect cancellation.
- Version and validate persisted preferences with legacy migration.
- Bound parser, WebSocket payload, terminal dimension, input-helper, preview, and reconnect resources.

### Release information

- Current package version: `1.2.0`.
- Production deployment continues to use the existing GitHub Pages workflow and WebSocket relay configuration.
- Credentials remain terminal-only and are never persisted by PttChrome.
- Build metadata records the source commit and build date in developer mode.
