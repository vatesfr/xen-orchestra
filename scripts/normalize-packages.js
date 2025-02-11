#!/usr/bin/env node

'use strict'

const isEmpty = require('lodash/isEmpty')
const sortedObject = require('sorted-object')
const { dirname, join, relative } = require('path')

const usageToReadme = require('./usage-to-readme.js')
const { getPackages, noop, symlink, writeFile, unlink } = require('./utils')

const BABEL_ESLINTRC_PATH = join(__dirname, 'babel-eslintrc.js')
const NPMIGNORE_PATH = join(__dirname, 'npmignore')

const deleteIfEmpty = (object, property) => {
  if (isEmpty(object[property])) {
    delete object[property]
  }
}

const deleteProperties = (object, property, properties) => {
  const nestedObject = object[property]
  if (nestedObject === undefined) {
    return
  }
  properties.forEach(property => {
    delete nestedObject[property]
  })
  deleteIfEmpty(object, property)
}

const forceRelativeSymlink = async (target, path) => {
  await unlink(path).catch(noop)
  return symlink(relative(dirname(path), target), path)
}

require('exec-promise')(() =>
  getPackages(true).map(({ dir, name, package: pkg, relativeDir }) => {
    // consider packages as private by default to avoid publishing them by mistake
    if (!('private' in pkg)) {
      pkg.private = true
    }

    pkg.name = name
    pkg.homepage = `https://github.com/vatesfr/xen-orchestra/tree/master/${relativeDir}`
    pkg.bugs = `https://github.com/vatesfr/xen-orchestra/issues`
    pkg.repository = {
      directory: relativeDir,
      type: 'git',
      url: 'https://github.com/vatesfr/xen-orchestra.git',
    }

    if (!('author' in pkg)) {
      pkg.author = {
        name: 'Vates SAS',
        url: 'https://vates.fr',
      }
    }
    if (!('license' in pkg)) {
      pkg.license = name.startsWith('@vates/') ? 'ISC' : 'AGPL-3.0-or-later'
    }
    if (!('version' in pkg)) {
      pkg.version = '0.0.0'
    }
    pkg.engines = {
      node: '>=18',
      ...pkg.engines,
    }

    delete pkg.files
    delete pkg.husky
    delete pkg.standard
    delete pkg['lint-staged']

    deleteIfEmpty(pkg, 'bin')
    deleteIfEmpty(pkg, 'dependencies')
    deleteIfEmpty(pkg, 'description')
    deleteIfEmpty(pkg, 'keywords')
    deleteProperties(pkg, 'config', ['commitizen'])
    deleteProperties(pkg, 'devDependencies', [
      'babel-7-jest',
      'babel-eslint',
      'babel-jest',
      'commitizen',
      'cz-conventional-changelog',
      'dependency-check',
      'eslint',
      'eslint-config-prettier',
      'eslint-config-standard',
      'eslint-plugin-import',
      'eslint-plugin-node',
      'eslint-plugin-promise',
      'eslint-plugin-standard',
      'flow-bin',
      'ghooks',
      'husky',
      'jest',
      'lint-staged',
      'prettier',
      'standard',
    ])
    deleteProperties(pkg, 'scripts', ['commitmsg', 'cz'])

    let { scripts = {} } = pkg
    const originalScripts = scripts

    if (!pkg.private && !('postversion' in scripts)) {
      scripts = { ...scripts, postversion: 'npm publish --access public' }
    }

    const prepublish = scripts.prepublish
    if (prepublish !== undefined && !('prepublishOnly' in scripts)) {
      scripts = {
        ...scripts,
        prepublishOnly: prepublish,
        prepublish: undefined,
      }
    }

    if (scripts !== originalScripts) {
      pkg.scripts = sortedObject(scripts)
    }

    const useBabel =
      pkg.devDependencies?.['@babel/core'] !== undefined || pkg.dependencies?.['@babel/core'] !== undefined

    return Promise.all([
      forceRelativeSymlink(NPMIGNORE_PATH, `${dir}/.npmignore`),
      usageToReadme(`${dir}/.USAGE.md`, dir, pkg).catch(error => {
        if (error.code !== 'ENOENT') {
          console.error('Error while handling README', error)
        }
      }),
      useBabel ? forceRelativeSymlink(BABEL_ESLINTRC_PATH, `${dir}/.eslintrc.js`) : unlink(`${dir}/.eslintrc.js`),
      writeFile(`${dir}/package.json`, JSON.stringify(pkg, null, 2) + '\n'),
      useBabel || unlink(`${dir}/.babelrc.js`),
      unlink(`${dir}/.editorconfig`),
      unlink(`${dir}/.flowconfig`),
      unlink(`${dir}/.gitignore`),
      unlink(`${dir}/.jshintrc`),
      unlink(`${dir}/.prettierrc.js`),
      unlink(`${dir}/.travis.yml`),
      unlink(`${dir}/ISSUE_TEMPLATE.lock`),
      unlink(`${dir}/package-lock.json`),
      unlink(`${dir}/yarn.lock`),
    ])
  })
)
