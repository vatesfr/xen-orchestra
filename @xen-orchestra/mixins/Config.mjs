import get from 'lodash/get.js'
import identity from 'lodash/identity.js'
import isEqual from 'lodash/isEqual.js'
import { createLogger } from '@xen-orchestra/log'
import { parseDuration } from '@vates/parse-duration'
import { watch } from 'app-conf'
import { resolve } from 'node:path'

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
    guiRoutes.xo5 = { url: '/v5', path: `${resolve(this._appDir, '..')}/xo-web/dist` }
    guiRoutes.xo6 = { url: '/v6', path: `${resolve(this._appDir, '../..')}/@xen-orchestra/web/dist` }

    if (channel === 'stable') {
      guiRoutes.default = { ...guiRoutes.xo5, url: '/' }
    } else {
      guiRoutes.default = { ...guiRoutes.xo6, url: '/' }
    }

    for (let [url, path] of Object.entries(mounts)) {
      url = url.replace(/(.+)\/$/, '$1')
      const conflictRoute = Object.entries(guiRoutes).find(([_, route]) => route.url === url)

      if (conflictRoute) {
        const [key] = conflictRoute
        guiRoutes[key] = { url, path }
      } else {
        const key = `xo${url
          .split('/')
          .map(s => s.charAt(0).toUpperCase() + s.slice(1))
          .join('')}`
        guiRoutes[key] = { url, path }
      }
    }

    return guiRoutes
  }
}
