#!/usr/bin/env bash
# Checks the Debian package given as the only argument, as root. Its only
# dependency is libc6 at the version build-deb.sh links against, below the
# glibc 2.36 of Debian 12, the oldest system the package supports: another
# dependency or a newer glibc fails here instead of on a user's machine.
# Then it installs the package and runs the installed binary: without a
# subcommand vectura exits 2 with a `vectura: ` line on standard error and
# nothing on standard output, which proves it runs and links. The Vectura
# workflow runs it.
set -euo pipefail

test "$(dpkg-deb --field "$1" Depends)" = 'libc6 (>= 2.34)'

dpkg --install "$1"
test "$(command -v vectura)" = /usr/bin/vectura

tmp=$(mktemp -d)
code=0
vectura > "$tmp/out" 2> "$tmp/err" || code=$?
test "$code" -eq 2
test ! -s "$tmp/out"
grep --quiet '^vectura: ' "$tmp/err"
