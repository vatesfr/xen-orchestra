import { ensureDir as mkdirp } from 'fs-extra'
import { readFile, writeFile } from 'fs/promises'
import { xdgConfig } from 'xdg-basedir'
import lodashGet from 'lodash/get.js'
import lodashUnset from 'lodash/unset.js'

// ===================================================================

const configPath = xdgConfig + '/xo-cli'
const configFile = configPath + '/config.json'

// ===================================================================

export function load() {
  return readFile(configFile)
    .then(JSON.parse)
    .catch(function () {
      return {}
    })
}

export function get(path) {
  return load().then(function (config) {
    return lodashGet(config, path)
  })
}

export function save(config) {
  return mkdirp(configPath).then(function () {
    return writeFile(configFile, JSON.stringify(config))
  })
}

export function set(data) {
  return load().then(function (config) {
    return save(Object.assign(config, data))
  })
}

export function unset(paths) {
  return load().then(function (config) {
    ;[].concat(paths).forEach(function (path) {
      lodashUnset(config, path)
    })
    return save(config)
  })
}
