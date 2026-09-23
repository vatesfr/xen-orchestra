#!/bin/sh
# Builds the Debian package into the directory given as the only argument.
#
# zig links the binary against glibc 2.34 whatever the glibc of the build
# machine, and dpkg-shlibdeps derives the libc6 requirement of the package
# from the symbols the binary uses: the package installs on Debian 12 and
# Ubuntu 22.04 wherever it is built. Needs zig, cargo-zigbuild, cargo-deb and
# dpkg-dev, see the README. The Vectura workflow and release.sh run it.
set -eu

out=$(mkdir -p "$1" && cd "$1" && pwd)
cd "$(dirname "$0")/.."

cargo zigbuild --locked --release --target x86_64-unknown-linux-gnu.2.34
# the glibc suffix is for zig only: the binary lands under the plain triple
cargo deb --locked --no-build --target x86_64-unknown-linux-gnu --output "$out"
