#!/bin/sh
# Releases vectura: `scripts/bump-pkg vectura <patch|minor|major>`, at the
# root of the repository, runs it for the `- vectura <type>` line of
# CHANGELOG.unreleased.md. Bumps the version of the crate, rebuilds its
# package in place of the previous one and commits both. See build-deb.sh
# for the tools it needs.
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

# The first `version` line of Cargo.toml is the one of [package], and the
# line after `name = "vectura"` in Cargo.lock is its entry there.
awk -v new="$new" '!done && /^version = / { $0 = "version = \"" new "\""; done = 1 } 1' Cargo.toml > Cargo.toml.tmp
mv Cargo.toml.tmp Cargo.toml
awk -v new="$new" 'prev == "name = \"vectura\"" && /^version = / { $0 = "version = \"" new "\"" } { print; prev = $0 }' Cargo.lock > Cargo.lock.tmp
mv Cargo.lock.tmp Cargo.lock

tmp=$(mktemp -d)
scripts/build-deb.sh "$tmp"

git rm --quiet --ignore-unmatch -- 'vectura_*.deb'
mv "$tmp"/vectura_*.deb .
rmdir "$tmp"
git add -- Cargo.toml Cargo.lock "vectura_$new-1_amd64.deb"
git commit --message "feat(vectura): $new"
