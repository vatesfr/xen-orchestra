'use strict'

// ===================================================================

import assign from 'lodash/assign'
import l33t from 'l33teral'
import xdgBasedir from 'xdg-basedir'

import { mkdirp, readFile, writeFile } from 'fs-extra'

const configPath = xdgBasedir.config + '/xo-upload-ova'
const configFile = configPath + '/config.json'

export async function load () {
  try {
    return JSON.parse(await readFile(configFile))
  } catch (e) {
    return {}
  }
}

export async function get (path) {
  const config = await load()
  return l33t(config).tap(path)
}

export async function save (config) {
  await mkdirp(configPath)
  await writeFile(configFile, JSON.stringify(config))
}

export async function set (data) {
  const config = await load()
  await save(assign(config, data))
}

export async function unset (paths) {
  const config = await load()
  const l33tConfig = l33t(config)
  ;[].concat(paths).forEach(function (path) {
    l33tConfig.purge(path, true)
  })
  return save(config)
}
