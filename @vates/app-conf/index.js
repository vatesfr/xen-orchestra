'use strict'

// ===================================================================

const chokidar = require('chokidar')
const dirname = require('path').dirname
const homedir = require('os').homedir
const resolvePath = require('path').resolve

const debug = require('debug')('app-conf')

const entries = require('./_entries')
const merge = require('./_merge')
const pMap = require('./_pMap')
const readFile = require('./_readFile')
const UnknownFormatError = require('./_unknown-format-error')
const unserialize = require('./_serializers').unserialize

// ===================================================================

function deriveEnvPrefix(appName) {
  return appName.toUpperCase().replace(/[^A-Z0-9]/g, '_') + '_'
}

function readEnvOverrides(prefix) {
  const result = {}
  for (const [key, value] of Object.entries(process.env)) {
    if (!key.startsWith(prefix)) continue
    const parts = key.slice(prefix.length).split('__')
    if (parts.some(_ => _ === '')) continue
    let obj = result
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]
      if (obj[part] === null || typeof obj[part] !== 'object') {
        obj[part] = {}
      }
      obj = obj[part]
    }
    obj[parts[parts.length - 1]] = value.startsWith('json:') ? JSON.parse(value.slice(5)) : value
  }
  return result
}

const RELATIVE_PATH_RE = /^\.{1,2}[/\\]/
function resolvePaths(value, base) {
  if (typeof value === 'string') {
    return value[0] === '~' && (value[1] === '/' || value[1] === '\\')
      ? homedir() + value.slice(1)
      : RELATIVE_PATH_RE.test(value)
        ? resolvePath(base, value)
        : value
  }

  if (value !== null && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      value[key] = resolvePaths(value[key], base)
    }
    return value
  }

  return value
}

// ===================================================================

function load(appName, opts = {}) {
  if (typeof appName === 'object' && appName !== null) {
    opts = appName
    ;({ appName } = opts)
  }
  const { appDir, defaults, envPrefix, ignoreUnknownFormats = false, serializers: customSerializers } = opts
  let { entries: whitelist } = opts
  const useWhitelist = whitelist !== undefined
  if (useWhitelist) {
    whitelist = new Set(whitelist)
  }
  const entryOpts = { appDir, appName }
  return pMap(entries, entry => {
    if (useWhitelist && !whitelist.has(entry.name)) {
      return []
    }

    const dirFn = entry.dir
    const dir = typeof dirFn === 'function' ? dirFn(entryOpts) : dirFn
    return entry.list(entryOpts, dir) || []
  })
    .then(files => {
      files = files.flat()
      return pMap(files, async file => {
        try {
          return await parse(file, { serializers: customSerializers })
        } catch (error) {
          if (!(ignoreUnknownFormats && error instanceof UnknownFormatError)) {
            throw error
          }
        }
      })
    })
    .then(data => {
      const config = data.reduce(
        (acc, cfg) => {
          if (cfg !== undefined) {
            merge(acc, cfg)
          }
          return acc
        },
        defaults === undefined ? {} : structuredClone(defaults)
      )

      if (envPrefix !== false && (!useWhitelist || whitelist.has('env'))) {
        const prefix = envPrefix !== undefined ? envPrefix : deriveEnvPrefix(appName)
        merge(config, readEnvOverrides(prefix))
      }

      return config
    })
}
exports.load = load
exports.UnknownFormatError = UnknownFormatError

// ===================================================================

async function parse(path, { serializers: customSerializers } = {}) {
  const file = await readFile(path)
  const data = unserialize(file, customSerializers)
  debug(file.path)
  return resolvePaths(data, dirname(file.path))
}
exports.parse = parse

// ===================================================================

const ALL_ENTRIES = [...entries.map(_ => _.name), 'env']

exports.watch = function watch(
  { appName, defaults, entries: whitelist = ALL_ENTRIES, initialLoad = false, ...opts },
  cb
) {
  return new Promise((resolve, reject) => {
    const dirs = []
    const entryOpts = { appName, appDir: opts.appDir }
    entries.forEach(entry => {
      // vendor config should not change and is therefore not watched
      //
      // otherwise it could interfere if the program is running during
      // uninstall/reinstall
      if (entry.name === 'vendor') {
        return
      }

      const dirFn = entry.dir
      const dir = typeof dirFn === 'function' ? dirFn(entryOpts) : dirFn
      if (dir !== undefined) {
        dirs.push(dir)
      }
    })

    const watcher = chokidar.watch(dirs, {
      depth: 0,
      ignoreInitial: true,
      ignorePermissionErrors: true,
    })

    let debounceTimer
    const loadWrapper = () => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        load(appName, opts).then(config => cb(undefined, config), cb)
      }, 100)
    }

    watcher
      .on('all', loadWrapper)
      .once('error', reject)
      .once('ready', async () => {
        function unsubscribe() {
          clearTimeout(debounceTimer)
          return watcher.close()
        }

        // vendor config is only read once and merged to defaults to avoid issues
        // in case it has been deleted and another entry triggers a reload
        if (whitelist.includes('vendor')) {
          opts.entries = ['vendor']

          const vendor = await load(appName, opts)

          opts.defaults = defaults === undefined ? vendor : merge(structuredClone(defaults), vendor)
          opts.entries = whitelist.filter(_ => _ !== 'vendor')
        }

        if (initialLoad) {
          try {
            cb(undefined, await load(appName, opts))
            resolve(unsubscribe)
          } catch (error) {
            try {
              await unsubscribe()
            } catch (_) {
              /* empty */
            }
            reject(error)
          }
        } else {
          resolve(unsubscribe)
        }
      })
  })
}
