#!/usr/bin/env node
'use strict'

const { program, Argument } = require('commander')
const DepTree = require('deptree')
const fs = require('fs').promises
const joinPath = require('path').join
const semver = require('semver')
const { getPackages } = require('./utils')
const escapeRegExp = require('lodash/escapeRegExp')
const invert = require('lodash/invert')

const changelogConfig = {
  path: joinPath(__dirname, '../CHANGELOG.unreleased.md'),
  startTag: '<!--packages-start-->',
  endTag: '<!--packages-end-->',
}

program
  .argument('<package-name>', 'The name of the package to release')
  .addArgument(new Argument('<release-type>', 'The type of release to perform').choices(['patch', 'minor', 'major']))
  .option('-r, --read-changelog', 'Import existing packages from the changelog')
  .option('-w, --write-changelog', 'Write output to the changelog')
  .option('--force', 'Required when using --write-changelog without --read-changelog')
  .showHelpAfterError(true)
  .showSuggestionAfterError(true)
  .parse()

const [rootPackageName, rootReleaseType] = program.args
const { readChangelog, writeChangelog, force } = program.opts()

if (writeChangelog && !readChangelog && !force) {
  // Stop the process to prevent unwanted changelog overwrite
  program.showHelpAfterError(false).error(`
  WARNING: Using --write-changelog without --read-changelog will remove existing packages list.
  If you are sure you want to do this, add --force.
  `)
}

const RELEASE_WEIGHT = { PATCH: 1, MINOR: 2, MAJOR: 3 }
const RELEASE_TYPE = invert(RELEASE_WEIGHT)
const rootReleaseWeight = releaseTypeToWeight(rootReleaseType)

/** @type {Map<string, int>} A mapping of package names to their release weight */
const packagesToRelease = new Map([[rootPackageName, rootReleaseWeight]])

const dependencyTree = new DepTree()

async function main() {
  if (readChangelog) {
    await importPackagesFromChangelog()
  }

  const packages = await getPackages(true)
  const rootPackage = packages.find(pkg => pkg.name === rootPackageName)

  if (!rootPackage) {
    program.showHelpAfterError(false).error(`error: Package ${rootPackageName} not found`)
  }

  dependencyTree.add(rootPackage.name)

  /**
   * Recursively add dependencies to the dependency tree
   *
   * @param {string} handledPackageName The name of the package to handle
   * @param {string} handledPackageNextVersion The next version of the package to handle
   */
  function handlePackage(handledPackageName, handledPackageNextVersion) {
    packages.forEach(({ package: { name, version, dependencies, optionalDependencies, peerDependencies } }) => {
      let releaseWeight

      if (
        shouldPackageBeReleased(
          handledPackageName,
          { ...dependencies, ...optionalDependencies },
          handledPackageNextVersion
        )
      ) {
        releaseWeight = RELEASE_WEIGHT.PATCH
      } else if (shouldPackageBeReleased(handledPackageName, peerDependencies || {}, handledPackageNextVersion)) {
        releaseWeight = versionToReleaseWeight(version)
      }

      if (releaseWeight !== undefined) {
        registerPackageToRelease(name, releaseWeight)
        dependencyTree.add(name, handledPackageName)
        handlePackage(name, getNextVersion(version, releaseWeight))
      }
    })
  }

  handlePackage(rootPackage.name, getNextVersion(rootPackage.version, rootReleaseWeight))

  const outputLines = dependencyTree.resolve().map(dependencyName => {
    const releaseTypeName = RELEASE_TYPE[packagesToRelease.get(dependencyName)].toLocaleLowerCase()
    return `- ${dependencyName} ${releaseTypeName}`
  })

  const outputLog = ['', 'New packages list:', '', ...outputLines]

  if (writeChangelog) {
    await updateChangelog(outputLines)
    outputLog.unshift('', `File updated: ${changelogConfig.path}`)
  }

  console.log(outputLog.join('\n'))
}

function releaseTypeToWeight(type) {
  return RELEASE_WEIGHT[type.toLocaleUpperCase()]
}

/**
 * @param {string} name The package name to check
 * @param {object} dependencies The package dependencies name/constraint map
 * @param {string} version The version to check the dependency constraint against
 * @returns {boolean}
 */
function shouldPackageBeReleased(name, dependencies, version) {
  if (!Object.prototype.hasOwnProperty.call(dependencies, name)) {
    return false
  }

  return (
    ['xo-web', 'xo-server', '@xen-orchestra/proxy'].includes(name) || !semver.satisfies(version, dependencies[name])
  )
}

/**
 * @param {string} packageName
 * @param {int} releaseWeight
 */
function registerPackageToRelease(packageName, releaseWeight) {
  const currentWeight = packagesToRelease.get(packageName) || 0

  packagesToRelease.set(packageName, Math.max(currentWeight, releaseWeight))
}

/**
 * @param {string} version
 * @returns {int}
 */
function versionToReleaseWeight(version) {
  return semver.major(version) > 0
    ? RELEASE_WEIGHT.MAJOR
    : semver.minor(version) > 0
    ? RELEASE_WEIGHT.MINOR
    : RELEASE_WEIGHT.PATCH
}

/**
 * @param {string} version The version to increment
 * @param {int} releaseWeight The release weight to apply
 * @returns {string} The incremented version
 */
function getNextVersion(version, releaseWeight) {
  return semver.inc(version, RELEASE_TYPE[releaseWeight])
}

const changelogRegex = new RegExp(
  `${escapeRegExp(changelogConfig.startTag)}(.*)${escapeRegExp(changelogConfig.endTag)}`,
  's'
)

async function importPackagesFromChangelog() {
  const content = await fs.readFile(changelogConfig.path)
  const block = changelogRegex.exec(content)?.[1].trim()

  if (block === undefined) {
    throw new Error(`Could not find changelog block in ${changelogConfig.path}`)
  }

  const lines = block.matchAll(/^- (?<name>[^ ]+) (?<type>patch|minor|major)$/gm)

  for (const { groups: { name, type } } of lines) {
    registerPackageToRelease(name, releaseTypeToWeight(type))
    dependencyTree.add(name)
  }
}

async function updateChangelog(lines) {
  const content = await fs.readFile(changelogConfig.path)
  await fs.writeFile(
    changelogConfig.path,
    content
      .toString()
      .replace(changelogRegex, [changelogConfig.startTag, '', ...lines, '', changelogConfig.endTag].join('\n'))
  )
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
