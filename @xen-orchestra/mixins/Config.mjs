import get from 'lodash/get.js'
import identity from 'lodash/identity.js'
import isEqual from 'lodash/isEqual.js'
import { createLogger } from '@xen-orchestra/log'
import { parseDuration } from '@vates/parse-duration'
import { watch } from 'app-conf'
import assert from 'node:assert'

const { warn, info } = createLogger('xo:mixins:config')

// if path is undefined, an empty string or an empty array, returns the root value
const niceGet = (value, path) => (path === undefined || path.length === 0 ? value : get(value, path))

export default class Config {
  constructor(app, { appDir, appName, config }) {
    this._app = app
    this._appDir = appDir
    this._config = config
    const watchers = (this._watchers = new Set())

    app.hooks.on('start', async () => {
      app.hooks.once(
        'stop',
        await watch({ appDir, appName, ignoreUnknownFormats: true }, (error, config) => {
          if (error != null) {
            return warn(error)
          }

          this._config = config
          watchers.forEach(watcher => {
            watcher(config)
          })
        })
      )
    })
  }

  get(path) {
    const value = niceGet(this._config, path)
    if (value === undefined) {
      throw new TypeError('missing config entry: ' + path)
    }
    return value
  }

  getDuration(path) {
    return parseDuration(this.get(path))
  }

  getOptional(path) {
    return niceGet(this._config, path)
  }

  getOptionalDuration(path) {
    const value = this.getOptional(path)
    return value === undefined ? undefined : parseDuration(value)
  }

  watch(path, cb) {
    // short syntax for the whole config: watch(cb)
    if (typeof path === 'function') {
      cb = path
      path = undefined
    }

    // internal arg
    const processor = arguments.length > 2 ? arguments[2] : identity

    // unique value to ensure first run even if the value is `undefined`
    let prev = {}

    const watcher = config => {
      try {
        const value = processor(niceGet(config, path))
        if (!isEqual(value, prev)) {
          const previous = prev
          prev = value
          cb(value, previous, path)
        }
      } catch (error) {
        warn('watch', { error, path })
      }
    }

    // ensure sync initialization
    watcher(this._config)

    const watchers = this._watchers
    watchers.add(watcher)
    return () => watchers.delete(watcher)
  }

  watchDuration(path, cb) {
    return this.watch(path, cb, parseDuration)
  }

  async getGuiRoutes() {
    const mounts = this.getOptional('http.mounts') ?? {}

    let channel = 'latest'
    try {
      channel = await this._app.getCurrentChannel?.()
    } catch (error) {
      info('Unable to get current channel, fallback to latest', error)
    }

    const guiRoutes = {}

    for (let [url, path] of Object.entries(mounts)) {
      url = url.replace(/(.+)\/$/, '$1')

      const key = `xo${url
        .split('/')
        .map(s => s.charAt(0).toUpperCase() + s.slice(1))
        .join('')}`
      guiRoutes[key] = { url, path }
    }

    // Try to find the normal v5 and v5 paths
    const v5 = Object.values(guiRoutes).find(route => route.path.includes('xo-web/dist'))
    const v6 = Object.values(guiRoutes).find(route => route.path.includes('@xen-orchestra/web/dist'))

    // If no v5 or v6 route is present but its normal path is provided, we add it to the route list.
    guiRoutes.v5 = v5
    guiRoutes.v6 = v6

    // If no defaut route is present, we set it to the appropriate path depending on the channel and available paths.
    if (Object.values(guiRoutes).find(route => route.url === '/') === undefined) {
      if (channel === 'stable') {
        assert.notStrictEqual(v5, undefined, `No path for v5 found in config`)
        guiRoutes.default = { path: v5.path, url: '/' }
      } else {
        if (v6 === undefined) {
          assert.notStrictEqual(v5, undefined, `No path for v5 found in config`)
          guiRoutes.default = { path: v5.path, url: '/' }
        } else {
          guiRoutes.default = { path: v6.path, url: '/' }
        }
      }
    }

    return guiRoutes
  }
}
