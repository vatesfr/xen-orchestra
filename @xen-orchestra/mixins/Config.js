const get = require('lodash/get')
const identity = require('lodash/identity')
const isEqual = require('lodash/isEqual')
const { createLogger } = require('@xen-orchestra/log')
const { parseDuration } = require('@vates/parse-duration')
const { watch } = require('app-conf')

const { warn } = createLogger('xo:mixins:config')

module.exports = class Config {
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
        if (!isEqual(value, prev)) {
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
