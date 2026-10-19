'use strict'

// ===================================================================
const chokidar = require('chokidar')
const dirname = require('path').dirname
const homedir = require('os').homedir
const resolvePath = require('path').resolve
const debug = require('debug')('app-conf')
const entries = require('./_entries') as Entry[]
const merge = require('./_merge')
const pMap = require('./_pMap')
const readFile = require('./_readFile')
const UnknownFormatError = require('./_unknown-format-error')
const unserialize = require('./_serializers').unserialize

// ===================================================================

type LoadOptions = {
  appName?: string
  appDir?: string
  defaults?: Record<string, unknown>
  envPrefix?: string | false
  ignoreUnknownFormats?: boolean
  serializers?: unknown
  entries?: string[]
}

type EntryOptions = {
  appDir?: string
  appName?: string
}

type Entry = {
  name: string
  dir?: string | ((opts: EntryOptions) => string | undefined)
  list: (opts: EntryOptions, dir?: string) => string[] | undefined | Promise<string[]>
}

interface ParseOptions {
  serializers?: unknown
}

interface WatchOptions {
  appName: string
  defaults?: unknown
  entries?: string[]
  initialLoad?: boolean
  appDir?: string
  [key: string]: unknown
}

type Config = unknown
type Unsubscribe = () => Promise<void>

interface ListSourcesOptions {
  appName: string
  appDir?: string
  entries?: string[]
}

interface SourceResult {
  name: string
  files: string[]
}

// ===================================================================

function deriveEnvPrefix(appName: string): string {
  return appName.toUpperCase().replace(/[^A-Z0-9]/g, '_') + '_'
}

function readEnvOverrides(prefix: string): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(process.env)) {
    if (value === undefined) continue
    if (!key.startsWith(prefix)) continue
    const parts = key.slice(prefix.length).split('__')
    if (parts.some(_ => _ === '')) continue
    let obj: Record<string, unknown> = result
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]
      if (obj[part] === null || typeof obj[part] !== 'object' || Array.isArray(obj[part])) {
        obj[part] = {}
      }
      obj = obj[part] as Record<string, unknown>
    }
    obj[parts[parts.length - 1]] = value.startsWith('json:') ? JSON.parse(value.slice(5)) : value
  }
  return result
}

const RELATIVE_PATH_RE = /^\.{1,2}[/\\]/

function resolvePaths<T>(value: T, base: string): T {
  if (typeof value === 'string') {
    return (
      value[0] === '~' && (value[1] === '/' || value[1] === '\\')
        ? homedir() + value.slice(1)
        : RELATIVE_PATH_RE.test(value)
          ? resolvePath(base, value)
          : value
    ) as T
  }

  if (value !== null && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      ;(value as Record<string, unknown>)[key] = resolvePaths((value as Record<string, unknown>)[key], base)
    }
    return value
  }

  return value
}

// ===================================================================

export async function load(
  appNameOrOptions?: string | LoadOptions,
  opts: LoadOptions = {}
): Promise<Record<string, unknown>> {
  let appName: string | undefined

  if (typeof appNameOrOptions === 'object' && appNameOrOptions !== null) {
    opts = appNameOrOptions
    appName = opts.appName
  } else {
    appName = appNameOrOptions
  }

  const { appDir, defaults, envPrefix, ignoreUnknownFormats = false, serializers: customSerializers } = opts

  const whitelist = opts.entries ? new Set(opts.entries) : undefined

  const useWhitelist = whitelist !== undefined

  const entryOpts: EntryOptions = {
    appDir,
    appName,
  }

  return pMap(entries, (entry: Entry) => {
    if (useWhitelist && !whitelist.has(entry.name)) {
      return []
    }

    const dirFn = entry.dir

    const dir = typeof dirFn === 'function' ? dirFn(entryOpts) : dirFn

    return entry.list(entryOpts, dir) || []
  })
    .then((files: any) => {
      return pMap(files.flat(), async (file: any) => {
        try {
          return await parse(file, {
            serializers: customSerializers,
          })
        } catch (error) {
          if (!(ignoreUnknownFormats && error instanceof UnknownFormatError)) {
            throw error
          }
        }
      })
    })
    .then((data: unknown[]) => {
      const config = data.reduce<Record<string, unknown>>(
        (acc, cfg) => {
          if (cfg !== undefined) {
            merge(acc, cfg)
          }

          return acc
        },
        defaults === undefined ? {} : structuredClone(defaults)
      )

      if (envPrefix !== false && (!useWhitelist || whitelist!.has('env'))) {
        if (!appName && envPrefix === undefined) {
          throw new Error('appName is required when deriving env prefix')
        }

        let prefix: string

        if (envPrefix !== undefined) {
          prefix = envPrefix
        } else {
          if (!appName) {
            throw new Error('appName is required when deriving env prefix')
          }

          prefix = deriveEnvPrefix(appName)
        }

        merge(config, readEnvOverrides(prefix))
      }

      return config
    })
}

export { UnknownFormatError }

// ===================================================================

export async function parse(path: string, { serializers: customSerializers }: ParseOptions = {}): Promise<unknown> {
  const file = await readFile(path)
  const data = unserialize(file, customSerializers)

  debug(file.path)

  return resolvePaths(data, dirname(file.path))
}

// ===================================================================

const ALL_ENTRIES = [...entries.map(_ => _.name), 'env']

export function watch(
  { appName, defaults, entries: whitelist = ALL_ENTRIES, initialLoad = false, ...opts }: WatchOptions,
  cb: (err?: unknown, config?: Config) => void
): Promise<Unsubscribe> {
  return new Promise((resolve, reject) => {
    const dirs: string[] = []
    const entryOpts = { appName, appDir: opts.appDir }

    entries.forEach(entry => {
      // vendor config should not change and is therefore not watched
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

    let debounceTimer: NodeJS.Timeout

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
        async function unsubscribe() {
          clearTimeout(debounceTimer)
          await watcher.close()
        }

        // vendor config is only read once and merged to defaults
        if (whitelist.includes('vendor')) {
          opts.entries = ['vendor']

          const vendor = await load(appName, opts)

          opts.defaults = defaults === undefined ? vendor : merge(structuredClone(defaults), vendor)

          opts.entries = whitelist.filter(e => e !== 'vendor')
        }

        if (initialLoad) {
          try {
            cb(undefined, await load(appName, opts))
            resolve(unsubscribe)
          } catch (error) {
            try {
              await unsubscribe()
            } catch {
              // ignore
            }

            reject(error)
          }
        } else {
          resolve(unsubscribe)
        }
      })
  })
}

// ===================================================================

export async function listSources(
  appName: string,
  { appDir, entries: whitelist }: Omit<ListSourcesOptions, 'appName'> = {}
): Promise<SourceResult[]> {
  const useWhitelist = whitelist !== undefined
  const entryWhitelist = useWhitelist ? new Set(whitelist) : undefined
  const entryOpts = { appDir, appName }

  const results = await pMap(entries, async (entry: Entry): Promise<SourceResult> => {
    if (useWhitelist && !entryWhitelist!.has(entry.name)) {
      return {
        name: entry.name,
        files: [],
      }
    }

    const dirFn = entry.dir
    const dir = typeof dirFn === 'function' ? dirFn(entryOpts) : dirFn

    const files = (await entry.list(entryOpts, dir)) ?? []

    return {
      name: entry.name,
      files,
    }
  })

  return results
}
