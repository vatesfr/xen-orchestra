'use strict'

const { LEVELS, resolve } = require('./levels.js')
const compileGlobPattern = require('./_compileGlobPattern.js')

function compileFilter(filter) {
  if (filter === undefined) {
    return
  }

  const type = typeof filter
  if (type === 'function') {
    return filter
  }
  if (type === 'string') {
    const re = compileGlobPattern(filter)
    return log => log.level >= LEVELS.DEBUG && re.test(log.namespace)
  }

  if (Array.isArray(filter)) {
    const filters = filter.map(compileFilter).filter(_ => _ !== undefined)
    const { length } = filters
    if (length === 0) {
      return
    }
    if (length === 1) {
      return filters[0]
    }
    return log => {
      for (let i = 0; i < length; ++i) {
        if (filters[i](log)) {
          return true
        }
      }
      return false
    }
  }

  throw new TypeError('unsupported `filter`')
}

module.exports = function createTransport(config) {
  if (typeof config === 'function') {
    return config
  }

  if (Array.isArray(config)) {
    const transports = config.map(createTransport)
    const { length } = transports
    return function () {
      for (let i = 0; i < length; ++i) {
        transports[i].apply(this, arguments)
      }
    }
  }

  const { type } = config
  if (type !== undefined) {
    if (typeof type !== 'string') {
      throw new TypeError('transport type property must be a string')
    }

    if (type.includes('/')) {
      throw new TypeError('invalid transport type')
    }

    const { ...opts } = config
    return require(`./transports/${type}.js`)(opts)
  }

  const level = resolve(config.level)
  const filter = compileFilter([config.filter, level === undefined ? undefined : log => log.level >= level])

  let transport = createTransport(config.transport)

  if (filter !== undefined) {
    const orig = transport
    transport = function (log) {
      if (filter(log)) {
        return orig.apply(this, arguments)
      }
    }
  }

  return transport
}
