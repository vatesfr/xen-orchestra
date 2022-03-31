import assign from 'lodash/assign'
import get_ from 'lodash/get'
import unset_ from 'lodash/unset'
import xdgBasedir from 'xdg-basedir'

import { mkdirp, readFile, writeFile } from 'fs-extra'

const configPath = xdgBasedir.config + '/xo-upload-ova'
const configFile = configPath + '/config.json'

export async function load() {
  try {
    return JSON.parse(await readFile(configFile))
  } catch (e) {
    return {}
  }
}

export async function get(path) {
  return get_(await load(), path)
}

export async function save(config) {
  await mkdirp(configPath)
  await writeFile(configFile, JSON.stringify(config))
}

export async function set(data) {
  const config = await load()
  await save(assign(config, data))
}

export async function unset(paths) {
  const config = await load()
  ;[].concat(paths).forEach(function (path) {
    unset_(config, path)
  })
  return save(config)
}
