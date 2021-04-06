import get from 'lodash/get'
import identity from 'lodash/identity'
import { createLogger } from '@xen-orchestra/log'
import { parseDuration } from '@vates/parse-duration'
import { watch } from 'app-conf'

const { warn } = createLogger('xo:proxy:config')

export default class Config {
  constructor(app, { appDir, appName, config }) {
    this._config = config
    const watchers = (this._watchers = new Set())

    app.hooks.on('start', async () => {
      app.hooks.on(
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
    const value = get(this._config, path)
    if (value === undefined) {
      throw new TypeError('missing config entry: ' + value)
    }
    return value
  }

  getDuration(path) {
    return parseDuration(this.get(path))
  }

  watch(path, cb) {
    // internal arg
    const processor = arguments.length > 2 ? arguments[2] : identity

    let prev
    const watcher = config => {
      try {
        const value = processor(get(config, path))
        if (value !== prev) {
          prev = value
          cb(value)
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
