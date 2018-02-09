'use strict'

// ===================================================================

const promisify = require('bluebird').promisify

const readFile = promisify(require('fs').readFile)
const writeFile = promisify(require('fs').writeFile)

const assign = require('lodash/assign')
const l33t = require('l33teral')
const mkdirp = promisify(require('mkdirp'))
const xdgBasedir = require('xdg-basedir')

// ===================================================================

const configPath = xdgBasedir.config + '/xo-cli'
const configFile = configPath + '/config.json'

// ===================================================================

const load = (exports.load = function () {
  return readFile(configFile)
    .then(JSON.parse)
    .catch(function () {
      return {}
    })
})

exports.get = function (path) {
  return load().then(function (config) {
    return l33t(config).tap(path)
  })
}

const save = (exports.save = function (config) {
  return mkdirp(configPath).then(function () {
    return writeFile(configFile, JSON.stringify(config))
  })
})

exports.set = function (data) {
  return load().then(function (config) {
    return save(assign(config, data))
  })
}

exports.unset = function (paths) {
  return load().then(function (config) {
    const l33tConfig = l33t(config)
    ;[].concat(paths).forEach(function (path) {
      l33tConfig.purge(path, true)
    })
    return save(config)
  })
}
