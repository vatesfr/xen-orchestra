'use strict'

const assert = require('assert/strict')

const originalLookup = require('dns').lookup
const LRU = require('lru-cache')

function reportResult(all, result, callback) {
  if (result[0]) {
    return callback(result[1])
  }

  const results = result[1]
  if (all) {
    callback(null, results)
  } else {
    const first = results[0]
    callback(null, first.address, first.family)
  }
}

exports.createCachedLookup = function createCachedLookup({ lookup = originalLookup } = {}) {
  const cache = new LRU({
    max: 500,

    // 1 minute: long enough to be effective, short enough so there is no need to bother with DNS TTLs
    ttl: 60e3,
  })

  return function cachedLookup(hostname, options, callback) {
    let all = false
    let family = 0
    if (typeof options === 'function') {
      callback = options
    } else if (typeof options === 'number') {
      family = options
    } else if (options != null) {
      assert.notEqual(options.verbatim, false, 'not supported by this implementation')
      ;({ all = all, family = family } = options)
    }

    // cache by family option because there will be an error if there is no
    // entries for the requestion family so we cannot easily cache all families
    // and filter on reporting back
    const key = hostname + '/' + family

    const result = cache.get(key)
    if (result !== undefined) {
      setImmediate(reportResult, all, result, callback)
    } else {
      originalLookup(hostname, { all: true, family, verbatim: true }, function onLookup(error, results) {
        const isError = error != null
        const result = [isError, isError ? error : results]
        cache.set(key, result)
        return reportResult(all, result, callback)
      })
    }
  }
}
