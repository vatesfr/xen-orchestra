#!/bin/sh
# Build, check and version the repair ISO. Run as root from the repository root.
# Usage: scripts/build.sh
#   XO_REPAIR_VERSION=1.2.0 scripts/build.sh   # release build (CI sets it from the tag)
# Produces dist/xo-repair-<YYYYMMDD>-<commit or release version>.iso and its .sha256.
# The build date first, for every build: XO uses the last ISO of the pool by name.
set -eu

cd "$(dirname "$0")/.."

# root does not own the checkout: let git read it anyway
git() { command git -c safe.directory="$PWD" "$@"; }

version="$(date -u +%Y%m%d)-${XO_REPAIR_VERSION:-}"
if [ -z "${XO_REPAIR_VERSION:-}" ]; then
	version="$version$(git rev-parse --short=8 HEAD)"
	[ -z "$(git status --porcelain --untracked-files=no)" ] || version="$version-dirty"
fi

echo "$version" > config/includes.chroot/usr/lib/xo-repair/VERSION
lb config
lb build
scripts/check-iso.sh live-image-amd64.hybrid.iso

name="xo-repair-$version.iso"
mkdir -p dist
mv live-image-amd64.hybrid.iso "dist/$name"
(cd dist && sha256sum "$name" > "$name.sha256")

[ -z "${GITHUB_OUTPUT:-}" ] || echo "version=$version" >> "$GITHUB_OUTPUT"
echo "build: dist/$name"
