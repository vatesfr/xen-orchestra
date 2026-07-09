'use strict'

module.exports = function merge(target, source) {
  if (source === undefined) {
    return target
  }

  if (target === null || source === null || typeof target !== 'object' || typeof source !== 'object') {
    return source
  }

  for (const key of Object.keys(source)) {
    target[key] = merge(target[key], source[key])
  }
  return target
}
