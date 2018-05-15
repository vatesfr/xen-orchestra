import blocked from 'blocked'
import { createLogger } from '@xen-orchestra/log'
import { fromEvent } from 'promise-toolbox'

import { ensureDir, readdir } from 'fs-extra'

import Xo from './xo'

// ===================================================================

const { debug } = createLogger('xo:main')

// ===================================================================

async function registerPlugin (pluginPath, pluginName) {
  const plugin = require(pluginPath)
  const { description, version = 'unknown' } = (() => {
    try {
      return require(pluginPath + '/package.json')
    } catch (_) {
      return {}
    }
  })()

  // Supports both “normal” CommonJS and Babel's ES2015 modules.
  const {
    default: factory = plugin,
    configurationSchema,
    configurationPresets,
    testSchema,
  } = plugin

  // The default export can be either a factory or directly a plugin
  // instance.
  const instance =
    typeof factory === 'function'
      ? factory({
        xo: this,
        getDataDir: () => {
          const dir = `${this._config.datadir}/${pluginName}`
          return ensureDir(dir).then(() => dir)
        },
      })
      : factory

  await this.registerPlugin(
    pluginName,
    instance,
    configurationSchema,
    configurationPresets,
    description,
    testSchema,
    version
  )
}

const debugPlugin = createLogger('xo:plugin')

function registerPluginWrapper (pluginPath, pluginName) {
  debugPlugin('register %s', pluginName)

  return registerPlugin.call(this, pluginPath, pluginName).then(
    () => {
      debugPlugin(`successfully register ${pluginName}`)
    },
    error => {
      debugPlugin(`failed register ${pluginName}`)
      debugPlugin(error)
    }
  )
}

const PLUGIN_PREFIX = 'xo-server-'
const PLUGIN_PREFIX_LENGTH = PLUGIN_PREFIX.length

async function registerPluginsInPath (path) {
  const files = await readdir(path).catch(error => {
    if (error.code === 'ENOENT') {
      return []
    }
    throw error
  })

  await Promise.all(
    files.map(name => {
      if (name.startsWith(PLUGIN_PREFIX)) {
        return registerPluginWrapper.call(
          this,
          `${path}/${name}`,
          name.slice(PLUGIN_PREFIX_LENGTH)
        )
      }
    })
  )
}

async function registerPlugins (xo) {
  await Promise.all(
    [`${__dirname}/../node_modules/`, '/usr/local/lib/node_modules/'].map(
      xo::registerPluginsInPath
    )
  )
}

// ===================================================================

async function main ({ config, safeMode }) {
  {
    const debug = createLogger('xo:perf')
    blocked(ms => {
      debug('blocked for %sms', ms | 0)
    })
  }

  // Creates main object.
  const xo = new Xo(config)

  // Connects to all registered servers.
  await xo.start()

  // Trigger a clean job.
  await xo.clean()

  if (!safeMode) {
    await registerPlugins(xo)
  }

  await new Promise(resolve => {
    const onMessage = message => {
      if (message[0] === 'STOP') {
        process.removeListener('message', onMessage)
        resolve()
      }
    }
    process.on('message', onMessage)
  })

  await fromEvent(xo, 'stopped')
}
main().then(
  () => process.send(['STOPPED']),
  error => process.send(['STOPPED_WITH_ERROR', error])
)
