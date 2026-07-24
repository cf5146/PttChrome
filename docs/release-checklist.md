# Release Checklist

Use this checklist before creating a release tag or enabling a production Pages deployment.

## Source and policy

- [ ] Review `SECURITY.md` and confirm the private reporting path is current.
- [ ] Review `docs/threat-model.md` and `docs/state-ownership.md` for changed trust or ownership boundaries.
- [ ] Confirm credentials, terminal buffers, and session tokens are not persisted or logged.
- [ ] Confirm Telnet, WebSocket relay, SSH, and external image-preview limitations are documented.
- [ ] Review license, upstream attribution, bundled asset notices, and dependency licenses.

## Verification

- [ ] Run `corepack yarn install --immutable`.
- [ ] Run `corepack yarn lint`.
- [ ] Run `corepack yarn security:scan`.
- [ ] Run `corepack yarn typecheck`.
- [ ] Run `corepack yarn test`.
- [ ] Run `corepack yarn build`.
- [ ] Run the production preview smoke test.
- [ ] Inspect CSP violations, WebSocket destinations, image requests, and generated build metadata.
- [ ] Exercise safe and unsafe URL cases, disconnect/reconnect behavior, preference migration, and parser resource limits.

## Deployment

- [ ] Confirm the exact commit SHA and release tag.
- [ ] Confirm pull requests cannot deploy GitHub Pages.
- [ ] Confirm the Pages workflow uses the protected `github-pages` environment.
- [ ] Confirm the deployment source follows the current default-branch conditions.
- [ ] Record the supported browser and relay configuration in release notes.
- [ ] Record security-relevant changes and known transport/privacy limitations in `CHANGELOG.md`.
