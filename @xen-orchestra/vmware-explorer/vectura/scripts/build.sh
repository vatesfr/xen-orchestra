#!/bin/sh
# Builds the vectura binary into the directory given as the only argument.
#
# zig links the binary against glibc 2.34 whatever the glibc of the build
# machine, so it runs on Debian 12 and Ubuntu 22.04 wherever it is built.
# Needs zig and cargo-zigbuild, see the README. The Vectura workflow and
# release.sh run it.
set -eu

out=$(mkdir -p "$1" && cd "$1" && pwd)
cd "$(dirname "$0")/.."

cargo zigbuild --locked --release --target x86_64-unknown-linux-gnu.2.34
# the glibc suffix is for zig only: the binary lands under the plain triple
install -m 755 target/x86_64-unknown-linux-gnu/release/vectura "$out"
