#!/usr/bin/env node
'use strict'

const DepTree = require('deptree')
const fs = require('fs').promises
const joinPath = require('path').join
const semver = require('semver')
const { getPackages } = require('./utils')
const escapeRegExp = require('lodash/escapeRegExp')
const invert = require('lodash/invert')
const keyBy = require('lodash/keyBy')

const changelogConfig = {
  path: joinPath(__dirname, '../CHANGELOG.unreleased.md'),
  startTag: '<!--packages-start-->',
  endTag: '<!--packages-end-->',
}

const RELEASE_WEIGHT = { PATCH: 1, MINOR: 2, MAJOR: 3 }
const RELEASE_TYPE = invert(RELEASE_WEIGHT)

const dependencyTree = new DepTree()
/** @type {Map<string, int>} A mapping of package names to their release weight */
const packagesToRelease = new Map()

let allPackages

async function main(args, scriptName) {
  const toRelease = { __proto__: null }

  const testMode = args[0] === '--test'
  if (testMode) {
    args.shift()

    for (const arg of args) {
      const matches = /^(.+)@(patch|minor|major)$/.exec(arg)
      if (matches === null) {
        throw new Error('invalid arg: ' + arg)
      }
      toRelease[matches[1]] = matches[2]
    }
  } else {
    if (args.length !== 0) {
      process.stdout.write(`Usage:

  ${scriptName}
    Read the list of packages with changes from \`CHANGELOG.unreleased.md\` and compute the list of packages to be released.

  ${scriptName} --test <name>@<release type>...
    Compute the list of packages to be released from the list of changed packages from the command line.

    Does not do any side effects.
`)
      return
    }
    readPackagesFromChangelog(toRelease)
  }

  allPackages = keyBy(await getPackages(true), 'name')

  Object.entries(toRelease).forEach(([packageName, releaseType]) => {
    const rootPackage = allPackages[packageName]

    if (!rootPackage) {
      throw new Error(`Package "${packageName}" does not exist`)
    }

    const rootReleaseWeight = releaseTypeToWeight(releaseType)
    registerPackageToRelease(packageName, rootReleaseWeight)
    dependencyTree.add(rootPackage.name)

    handlePackageDependencies(rootPackage.name, getNextVersion(rootPackage.version, rootReleaseWeight))
  })

  const commandsToExecute = ['', 'Commands to execute:', '']
  const releasedPackages = ['', '### Released packages', '']

  dependencyTree.resolve().forEach(dependencyName => {
    const releaseWeight = packagesToRelease.get(dependencyName)
    const {
      package: { version },
    } = allPackages[dependencyName]
    commandsToExecute.push(`./scripts/bump-pkg ${dependencyName} ${RELEASE_TYPE[releaseWeight].toLocaleLowerCase()}`)
    releasedPackages.push(`- ${dependencyName} ${getNextVersion(version, releaseWeight)}`)
  })

  console.log(commandsToExecute.join('\n'))
  console.log(releasedPackages.join('\n'))
}

async function readPackagesFromChangelog(toRelease) {
  const content = await fs.readFile(changelogConfig.path)
  const changelogRegex = new RegExp(
    `${escapeRegExp(changelogConfig.startTag)}(.*)${escapeRegExp(changelogConfig.endTag)}`,
    's'
  )
  const block = changelogRegex.exec(content)?.[1].trim()

  if (block === undefined) {
    throw new Error(`Could not find changelog block in ${changelogConfig.path}`)
  }

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
    toRelease[name] = releaseType
  })
}

/**
 * Recursively add dependencies to the dependency tree
 *
 * @param {string} packageName The name of the package to handle
 * @param {string} packageNextVersion The next version of the package to handle
 */
function handlePackageDependencies(packageName, packageNextVersion) {
  Object.values(allPackages).forEach(
    ({ package: { name, version, dependencies, optionalDependencies, peerDependencies } }) => {
      let releaseWeight

      if (shouldPackageBeReleased(packageName, { ...dependencies, ...optionalDependencies }, packageNextVersion)) {
        releaseWeight = RELEASE_WEIGHT.PATCH
      } else if (shouldPackageBeReleased(packageName, peerDependencies || {}, packageNextVersion)) {
        releaseWeight = versionToReleaseWeight(version)
      }

      if (releaseWeight !== undefined) {
        registerPackageToRelease(name, releaseWeight)
        dependencyTree.add(name, packageName)
        handlePackageDependencies(name, getNextVersion(version, releaseWeight))
      }
    }
  )
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
  return semver.inc(version, RELEASE_TYPE[releaseWeight].toLocaleLowerCase())
}

main(process.argv.slice(2), process.argv[1]).catch(error => {
  console.error(error)
  process.exit(1)
})
