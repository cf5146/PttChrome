# Third-Party Notices

This inventory records the attribution evidence currently present in the repository. Complete the open items before distributing a release artifact.

## Project license

- PttChrome includes [LICENSE](../LICENSE), the GNU General Public License version 3, dated 29 June 2007.
- `package.json` declares the SPDX expression `GPL-3.0-only`.

## Bundled cursor assets

- `src/cursor/` includes the Polar Cursor Theme.
- `src/cursor/COPYRIGHT.txt` attributes the theme to Eric Matthews and states GPL version 2 or later terms.
- Preserve that attribution and license text when redistributing the cursor assets.

## Bundled font

- `src/fonts/symmingliu.woff` is bundled by the application.
- A font license or attribution file is not currently present beside the asset. Obtain and record the font license before the next release; do not assume the project GPL covers this font.

## Icons and images

- `src/icon/` contains application icons and UI image assets.
- Individual source attribution or license metadata is not currently recorded for every icon and image. Verify the provenance and redistribution terms before tagging a release.

## Dependencies

Dependency versions are recorded in `package.json` and the Yarn lock data. Run the dependency audit and review license metadata for direct and transitive packages before release. Any package-specific notice required for distribution must be added here or in a generated notices artifact.

## Release blocker

The missing font and per-asset icon/image attribution records are open release tasks. This document is intentionally explicit so a release cannot claim complete attribution without resolving them.
