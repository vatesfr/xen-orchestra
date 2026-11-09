#!/bin/sh
# Bumps vectura: run it once, at the end of the pull request which changes
# vectura, then commit Cargo.toml, Cargo.lock and vectura. Bumps the version of
# the crate and rebuilds its binary in place of the previous one. vectura is
# not released on its own: the pull request lists
# `- @xen-orchestra/vmware-explorer <type>` in CHANGELOG.unreleased.md, whose
# release ships this binary as is. See build.sh for the tools it needs.
set -eu

case ${1-} in
  patch | minor | major) type=$1 ;;
  *)
    echo "Usage: $0 patch|minor|major" >&2
    exit 1
    ;;
esac

cd "$(dirname "$0")/.."

# as bump-pkg does with package.json: after a failed run, bumping again would
# skip a version
if ! git diff-index --quiet HEAD Cargo.toml; then
  echo "Changes detected in Cargo.toml, revert them first" >&2
  exit 1
fi

old=$(sed -n 's/^version = "\(.*\)"$/\1/p' Cargo.toml | head -n 1)
new=$(echo "$old" | awk -F. -v type="$type" '{
  if (type == "major") print $1 + 1 ".0.0"
  else if (type == "minor") print $1 "." $2 + 1 ".0"
  else print $1 "." $2 "." $3 + 1
}')
echo "vectura: $old -> $new ($type)"

tmp=$(mktemp -d)
# Until the binary is checked, a failure puts the version back, so that the
# script can run again. A copy rather than `git checkout`: it keeps a change
# not committed yet, such as a new dependency in Cargo.lock.
cp Cargo.toml Cargo.lock "$tmp"
trap 'cp "$tmp/Cargo.toml" "$tmp/Cargo.lock" .' EXIT

# The first `version` line of Cargo.toml is the one of [package], and the
# line after `name = "vectura"` in Cargo.lock is its entry there.
awk -v new="$new" '!done && /^version = / { $0 = "version = \"" new "\""; done = 1 } 1' Cargo.toml > Cargo.toml.tmp
mv Cargo.toml.tmp Cargo.toml
awk -v new="$new" 'prev == "name = \"vectura\"" && /^version = / { $0 = "version = \"" new "\"" } { print; prev = $0 }' Cargo.lock > Cargo.lock.tmp
mv Cargo.lock.tmp Cargo.lock

scripts/build.sh "$tmp"
scripts/check-binary.sh "$tmp/vectura"

# mv keeps the mode build.sh set, which git records: the binary stays
# executable in the npm package
mv "$tmp/vectura" vectura
trap - EXIT
rm -r "$tmp"
echo "vectura $new built: commit Cargo.toml, Cargo.lock and vectura"
