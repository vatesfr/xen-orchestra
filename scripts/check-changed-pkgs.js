#!/usr/bin/env node

// Fail if a package modified by the current branch is not listed in the
// `Packages to release` section of `CHANGELOG.unreleased.md`.
//
// Meant to run in the CI, on a branch already rebased on `master`.
//
// Only depends on Node builtins so that it can run without `yarn install`.

'use strict'

const { execFileSync } = require('child_process')
const { existsSync, readdirSync } = require('fs')
const joinPath = require('path').join

const { CHANGELOG_PATH, readChangelogPackages } = require('./_readChangelogPackages.js')

const ROOT_DIR = joinPath(__dirname, '..')

// branches are rebased before being merged, the merge base with `master` is
// therefore the commit the branch starts from
const BASE_REF = 'origin/master'

// how many changed files are shown per package in the error report
const MAX_REPORTED_FILES = 5

// packages which are never listed in `CHANGELOG.unreleased.md`
const IGNORED_PACKAGES = new Set([
  // build-time only configuration, never published
  '@xen-orchestra/babel-config',

  // released separately, `gen-deps-list.js` rejects it if listed
  '@xen-orchestra/lite',
])

// files which don't change what is shipped to users: a package whose changes
// are limited to them does not need to be released
const IGNORED_FILES = [
  // tests
  //
  // both `test/` and `tests/` are in use in this repository, they hold test
  // files, fixtures and helpers which are never shipped
  /(?:^|\/)(?:__snapshots__|tests?)\//,
  /\.(?:integ|load|spec|test)\.[cm]?[jt]sx?$/,

  // docs and repository metadata
  /(?:^|\/)docs\//,
  /(?:^|\/)(?:README\.md|\.USAGE\.md|\.gitignore|\.npmignore)$/,
]

/**
 * @param {string} file A path relative to the repository root
 * @returns {boolean}
 */
function isIgnoredFile(file) {
  return IGNORED_FILES.some(regex => regex.test(file))
}

/**
 * @param {readonly string[]} changedFiles Paths relative to the repository root
 * @param {ReadonlyMap<string, string>} packageNamesByDir A mapping of package directories (e.g. `@vates/types`) to package names
 * @returns {Map<string, string[]>} A mapping of package names to the changed files which require their release
 */
function getChangedPackages(changedFiles, packageNamesByDir) {
  const changedPackages = new Map()

  for (const file of changedFiles) {
    const parts = file.split('/')

    // a package file is always at least at the third level, e.g. `@vates/types/index.mts`
    if (parts.length < 3) {
      continue
    }

    const name = packageNamesByDir.get(`${parts[0]}/${parts[1]}`)
    if (name === undefined || IGNORED_PACKAGES.has(name) || isIgnoredFile(file)) {
      continue
    }

    let files = changedPackages.get(name)
    if (files === undefined) {
      changedPackages.set(name, (files = []))
    }
    files.push(file)
  }

  return changedPackages
}

/**
 * Mirrors `getPackages()` from `./utils`, without its dependencies
 *
 * @returns {Map<string, string>} A mapping of package directories (e.g. `@vates/types`) to package names
 */
function getPackageNamesByDir() {
  const packageNamesByDir = new Map()

  for (const scope of [undefined, '@vates', '@xen-orchestra']) {
    const scopeDir = scope ?? 'packages'

    for (const entry of readdirSync(joinPath(ROOT_DIR, scopeDir))) {
      const relativeDir = `${scopeDir}/${entry}`

      // a directory without a `package.json` is not a package
      if (existsSync(joinPath(ROOT_DIR, relativeDir, 'package.json'))) {
        packageNamesByDir.set(relativeDir, scope === undefined ? entry : `${scope}/${entry}`)
      }
    }
  }

  return packageNamesByDir
}

function git(...args) {
  return execFileSync('git', args, { cwd: ROOT_DIR, encoding: 'utf8', maxBuffer: 1e8 }).trimEnd()
}

/**
 * @returns {string[]} The files changed by the current branch, relative to the repository root
 */
function getChangedFiles() {
  let mergeBase
  try {
    mergeBase = git('merge-base', BASE_REF, 'HEAD')
  } catch (error) {
    const err = new Error(
      `could not compute the merge base with ${BASE_REF}, the whole history must be fetched (\`fetch-depth: 0\` with \`actions/checkout\`)`
    )
    err.cause = error
    throw err
  }

  // `--no-renames` so that the original path of a renamed file is reported as well
  const output = git('diff', '--name-only', '--no-renames', mergeBase, 'HEAD')

  return output === '' ? [] : output.split('\n')
}

async function main() {
  const changedPackages = getChangedPackages(getChangedFiles(), getPackageNamesByDir())

  const listedPackages = await readChangelogPackages()

  const missing = Array.from(changedPackages.keys())
    .filter(name => !(name in listedPackages))
    .sort()

  // `console` is how the other scripts of this directory report to the user
  if (missing.length === 0) {
    console.log(`✓ the ${changedPackages.size} changed package(s) are listed in CHANGELOG.unreleased.md`)
    return
  }

  console.error(
    `✗ ${missing.length} changed package(s) missing from the \`Packages to release\` list of ${CHANGELOG_PATH}:`
  )
  console.error('')
  for (const name of missing) {
    const files = changedPackages.get(name)
    console.error(`- ${name}`)
    for (const file of files.slice(0, MAX_REPORTED_FILES)) {
      console.error(`    ${file}`)
    }
    if (files.length > MAX_REPORTED_FILES) {
      console.error(`    … and ${files.length - MAX_REPORTED_FILES} other file(s)`)
    }
  }
  console.error('')
  console.error('Add them to the `Packages to release` section, keeping the list alphabetically ordered:')
  console.error('')
  for (const name of missing) {
    console.error(`- ${name} <patch|minor|major>`)
  }

  process.exitCode = 1
}

exports.getChangedPackages = getChangedPackages
exports.isIgnoredFile = isIgnoredFile

if (require.main === module) {
  main().catch(error => {
    console.error(error)
    process.exit(1)
  })
}
