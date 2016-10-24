'use strict'

// ===================================================================

var promisify = require('bluebird').promisify

var readFile = promisify(require('fs').readFile)
var writeFile = promisify(require('fs').writeFile)

var assign = require('lodash/assign')
var l33t = require('l33teral')
var mkdirp = promisify(require('mkdirp'))
var xdgBasedir = require('xdg-basedir')

// ===================================================================

var configPath = xdgBasedir.config + '/xo-cli'
var configFile = configPath + '/config.json'

// ===================================================================

var load = exports.load = function () {
  return readFile(configFile).then(JSON.parse).catch(function () {
    return {}
  })
}

exports.get = function (path) {
  return load().then(function (config) {
    return l33t(config).tap(path)
  })
}

var save = exports.save = function (config) {
  return mkdirp(configPath).then(function () {
    return writeFile(configFile, JSON.stringify(config))
  })
}

exports.set = function (data) {
  return load().then(function (config) {
    return save(assign(config, data))
  })
}

exports.unset = function (paths) {
  return load().then(function (config) {
    var l33tConfig = l33t(config)
    ;[].concat(paths).forEach(function (path) {
      l33tConfig.purge(path, true)
    })
    return save(config)
  })
}
