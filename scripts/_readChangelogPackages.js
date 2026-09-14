'use strict'

const escapeRegExp = require('lodash/escapeRegExp')
const fs = require('fs').promises
const joinPath = require('path').join

const CHANGELOG_PATH = joinPath(__dirname, '../CHANGELOG.unreleased.md')
const START_TAG = '<!--packages-start-->'
const END_TAG = '<!--packages-end-->'

/**
 * Read the `Packages to release` block of `CHANGELOG.unreleased.md`
 *
 * @returns {Promise<{ [packageName: string]: 'patch' | 'minor' | 'major' }>} A mapping of package names to their release type
 */
async function readChangelogPackages() {
  const content = await fs.readFile(CHANGELOG_PATH, 'utf8')
  const changelogRegex = new RegExp(`${escapeRegExp(START_TAG)}(.*)${escapeRegExp(END_TAG)}`, 's')
  const block = changelogRegex.exec(content)?.[1].trim()

  if (block === undefined) {
    throw new Error(`Could not find changelog block in ${CHANGELOG_PATH}`)
  }

  const toRelease = { __proto__: null }

  block.split('\n').forEach(rawLine => {
    const line = rawLine.trim()

    if (!line) {
      return
    }

    const match = line.match(/^-\s*(?<name>\S+)\s+(?<releaseType>patch|minor|major)$/)

    if (!match) {
      throw new Error(`Invalid line: "${rawLine}"`)
    }

    const { name, releaseType } = match.groups
    if (name in toRelease) {
      throw new Error('duplicate package to release in CHANGELOG.unreleased.md: ' + name)
    }

    toRelease[name] = releaseType
  })

  return toRelease
}

exports.CHANGELOG_PATH = CHANGELOG_PATH
exports.readChangelogPackages = readChangelogPackages
