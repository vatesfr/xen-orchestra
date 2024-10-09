import get from 'lodash/get.js'
import identity from 'lodash/identity.js'
import isEqual from 'lodash/isEqual.js'
import { createLogger } from '@xen-orchestra/log'
import { parseDuration } from '@vates/parse-duration'
import { watch } from 'app-conf'

const { warn } = createLogger('xo:mixins:config')

// if path is undefined, an empty string or an empty array, returns the root value
const niceGet = (value, path) => (path === undefined || path.length === 0 ? value : get(value, path))

export default class Config {
  constructor(app, { appDir, appName, config }) {
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
}
