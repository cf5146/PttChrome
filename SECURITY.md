# Security Policy

## Scope

This policy covers the PttChrome browser client, its static GitHub Pages deployment, the WebSocket relay configuration used by the client, and security-sensitive documentation or build workflows in this repository.

The PTT service and the Cloudflare Worker relay are external dependencies. Reports about those services should also be sent to their respective maintainers when appropriate.

## Supported Branches and Releases

- `dev` is the active development branch.
- The current GitHub Pages workflow deploys only under its repository-owner and default-branch conditions, or through the explicitly supported workflow dispatch path.
- Tagged releases are supported only when their release notes identify the supported browser, transport, proxy, and credential-storage behavior.
- Unreleased feature work and arbitrary deployment forks are not considered production support commitments.

## Reporting a Vulnerability

Use GitHub's private vulnerability reporting or security advisory feature for this repository when it is available. Do not disclose an unpatched vulnerability in a public issue, pull request, discussion, or chat.

If private reporting is not enabled, contact the repository owner through a private GitHub channel and include the repository name and a request for a security contact. Do not include credentials, live session tokens, or other secrets in the initial report.

Please include:

- A concise description of the vulnerability and its security impact.
- The affected branch, release, commit, URL, or build configuration.
- Reproduction steps or a minimal proof of concept that does not access other users' data.
- Browser, operating system, and deployment details when relevant.
- Any logs or screenshots needed to reproduce the issue, after removing credentials and personal data.
- Whether the issue affects the browser client, the relay boundary, GitHub Actions, GitHub Pages, or bundled third-party assets.

## Credential and Session Exposure

PttChrome does not implement autologin and does not persist usernames, passwords, terminal buffers, or session credentials. Credentials entered into a PTT terminal session should still be treated as sensitive.

If a credential, token, or private session value may have been exposed:

1. Stop using the affected session.
2. Change or revoke the exposed credential through PTT or the relevant provider.
3. Preserve only sanitized diagnostic information.
4. Report the exposure privately with the affected release or deployment URL.

Do not put credentials in issue text, URLs, local-storage snapshots, logs, analytics payloads, screenshots, or test fixtures.

## External URLs and Images

BBS content is untrusted input. PttChrome validates external navigation and image-preview URLs, but external images still disclose a network request and may disclose metadata such as timing, IP address, and the configured referrer policy to the image host. Do not enable previews when that disclosure is unacceptable.

The application does not treat an image provider or WebSocket relay as trusted merely because it is configured by default. Provider-generated image URLs must pass the same output validation as original BBS URLs.

## Transport Limitations

The deployed client connects through a WebSocket relay because browsers cannot override the WebSocket `Origin` header. The relay is a separate availability and security boundary.

The Telnet-compatible protocol path is not equivalent to end-to-end encrypted SSH. Users should not assume that browser-side rendering protects credentials or terminal content from an untrusted transport or relay.

## Response Expectations

This project is maintained as time permits. We will acknowledge privately reported issues when practical, assess their impact, and coordinate disclosure after a fix or mitigation is available. The reporter should avoid public disclosure until maintainers confirm that coordination is complete.
