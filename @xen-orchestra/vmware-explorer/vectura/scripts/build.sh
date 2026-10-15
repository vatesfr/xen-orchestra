#!/bin/sh
# Builds the vectura binary into the directory given as the only argument.
#
# zig links the binary against glibc 2.31 whatever the glibc of the build
# machine, so it runs on Debian 11 and Ubuntu 20.04 wherever it is built:
# XOA appliances still run Debian 11.
# Needs zig and cargo-zigbuild, see the README. The Vectura workflow and
# release.sh run it.
#
# The build is reproducible: with the zig and cargo-zigbuild below and the
# toolchain of rust-toolchain.toml, any machine builds the binary in git byte
# for byte, which the Vectura workflow checks.
set -eu

out=$(mkdir -p "$1" && cd "$1" && pwd)
cd "$(dirname "$0")/.."

# the versions the Vectura workflow installs: another one may build another
# binary
zig=0.16.0
zigbuild=0.23.4
if [ "$(zig version)" != "$zig" ]; then
  echo "needs zig $zig, found $(zig version)" >&2
  exit 1
fi
if [ "$(cargo-zigbuild --version)" != "cargo-zigbuild $zigbuild" ]; then
  echo "needs cargo-zigbuild $zigbuild, found $(cargo-zigbuild --version)" >&2
  exit 1
fi

# rustc writes the paths of the sources in the panic messages. Those of the
# dependencies lie in CARGO_HOME, those of std in the sysroot when the rust-src
# component is installed, /rustc/<commit> otherwise: both become what a
# machine without rust-src writes. RUSTFLAGS from the environment would change
# the binary, they are replaced.
sysroot=$(rustc --print sysroot)
commit=$(rustc -vV | sed -n 's/^commit-hash: //p')
RUSTFLAGS="--remap-path-prefix=${CARGO_HOME:-$HOME/.cargo}=/cargo --remap-path-prefix=$sysroot/lib/rustlib/src/rust=/rustc/$commit"
export RUSTFLAGS
unset CARGO_ENCODED_RUSTFLAGS

cargo zigbuild --locked --release --target x86_64-unknown-linux-gnu.2.31
# the glibc suffix is for zig only: the binary lands under the plain triple
install -m 755 target/x86_64-unknown-linux-gnu/release/vectura "$out"
