#!/bin/sh
# Build, check and version the docking ISO. Run as root, from any folder: it works in the package folder.
# Usage: scripts/build.sh
#   XO_DOCKING_VERSION=1.2.0 scripts/build.sh   # release build (CI sets it from the tag)
# Produces dist/vates-autopilot-docking-<YYYYMMDDTHHMMSSZ>-<commit or release version>.iso and its .sha256.
# The build date and time first, in UTC, for every build: XO uses the last ISO of the pool by name.
set -eu

cd "$(dirname "$0")/.."

# root does not own the checkout: let git read it anyway
# '*' and not "$PWD": the checkout is the root of the monorepo, not this package folder
git() { command git -c safe.directory='*' "$@"; }

version="$(date -u +%Y%m%dT%H%M%SZ)-${XO_DOCKING_VERSION:-}"
if [ -z "${XO_DOCKING_VERSION:-}" ]; then
	version="$version$(git rev-parse --short=8 HEAD)"
	# only this package: a change elsewhere in the monorepo does not end up in the ISO
	[ -z "$(git status --porcelain --untracked-files=no -- .)" ] || version="$version-dirty"
fi

echo "$version" > config/includes.chroot/usr/lib/xo-docking/VERSION
lb config
lb build
scripts/check-iso.sh live-image-amd64.hybrid.iso

name="vates-autopilot-docking-$version.iso"
mkdir -p dist
mv live-image-amd64.hybrid.iso "dist/$name"
(cd dist && sha256sum "$name" > "$name.sha256")

[ -z "${GITHUB_OUTPUT:-}" ] || echo "version=$version" >> "$GITHUB_OUTPUT"
echo "build: dist/$name"
