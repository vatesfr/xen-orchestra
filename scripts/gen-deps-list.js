#!/usr/bin/env node
'use strict'

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

const RELEASE_WEIGHT = { PATCH: 1, MINOR: 2, MAJOR: 3 }
const RELEASE_TYPE = invert(RELEASE_WEIGHT)

const dependencyTree = new DepTree()
/** @type {Map<string, int>} A mapping of package names to their release weight */
const packagesToRelease = new Map()

let allPackages

async function main() {
  allPackages = await getPackages(true)
  const content = await fs.readFile(changelogConfig.path)
  const changelogRegex = new RegExp(
    `${escapeRegExp(changelogConfig.startTag)}(.*)${escapeRegExp(changelogConfig.endTag)}`,
    's'
  )
  const block = changelogRegex.exec(content)?.[1].trim()

  if (block === undefined) {
    throw new Error(`Could not find changelog block in ${changelogConfig.path}`)
  }

  const lines = block.matchAll(/^- (?<name>[^ ]+) (?<type>patch|minor|major)$/gm)

  for (const {
    groups: { name, type },
  } of lines) {
    const rootPackage = allPackages.find(pkg => pkg.name === name)

    if (!rootPackage) {
      throw new Error(`error: Package ${name} not found`)
    }

    const rootReleaseWeight = releaseTypeToWeight(type)
    registerPackageToRelease(name, rootReleaseWeight)
    dependencyTree.add(rootPackage.name)

    handlePackageDependencies(rootPackage.name, getNextVersion(rootPackage.version, rootReleaseWeight))
  }

  const outputLines = dependencyTree.resolve().map(dependencyName => {
    const releaseTypeName = RELEASE_TYPE[packagesToRelease.get(dependencyName)].toLocaleLowerCase()
    return `- ${dependencyName} ${releaseTypeName}`
  })

  console.log(outputLines.join('\n'))
}

/**
 * Recursively add dependencies to the dependency tree
 *
 * @param {string} packageName The name of the package to handle
 * @param {string} packageNextVersion The next version of the package to handle
 */
function handlePackageDependencies(packageName, packageNextVersion) {
  allPackages.forEach(({ package: { name, version, dependencies, optionalDependencies, peerDependencies } }) => {
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
  })
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

main().catch(error => {
  console.error(error)
  process.exit(1)
})
