'use strict'

// ===================================================================

const promisify = require('bluebird').promisify

const readFile = promisify(require('fs').readFile)
const writeFile = promisify(require('fs').writeFile)

const get = require('lodash/get')
const mkdirp = require('mkdirp')
const unset = require('lodash/unset')
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
    return get(config, path)
  })
}

const save = (exports.save = function (config) {
  return mkdirp(configPath).then(function () {
    return writeFile(configFile, JSON.stringify(config))
  })
})

exports.set = function (data) {
  return load().then(function (config) {
    return save(Object.assign(config, data))
  })
}

exports.unset = function (paths) {
  return load().then(function (config) {
    ;[].concat(paths).forEach(function (path) {
      unset(config, path)
    })
    return save(config)
  })
}
