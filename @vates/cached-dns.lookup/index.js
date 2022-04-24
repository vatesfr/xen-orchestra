'use strict'

const assert = require('assert')
const dns = require('dns')
const LRU = require('lru-cache')

function reportResults(all, results, callback) {
  if (all) {
    callback(null, results)
  } else {
    const first = results[0]
    callback(null, first.address, first.family)
  }
}

exports.createCachedLookup = function createCachedLookup({ lookup = dns.lookup } = {}) {
  const cache = new LRU({
    max: 500,

    // 1 minute: long enough to be effective, short enough so there is no need to bother with DNS TTLs
    ttl: 60e3,
  })

  function cachedLookup(hostname, options, callback) {
    let all = false
    let family = 0
    if (typeof options === 'function') {
      callback = options
    } else if (typeof options === 'number') {
      family = options
    } else if (options != null) {
      assert.notStrictEqual(options.verbatim, false, 'not supported by this implementation')
      ;({ all = all, family = family } = options)
    }

    // cache by family option because there will be an error if there is no
    // entries for the requestion family so we cannot easily cache all families
    // and filter on reporting back
    const key = hostname + '/' + family

    const result = cache.get(key)
    if (result !== undefined) {
      setImmediate(reportResults, all, result, callback)
    } else {
      lookup(hostname, { all: true, family, verbatim: true }, function onLookup(error, results) {
        // errors are not cached because this will delay recovery after DNS/network issues
        //
        // there are no reliable way to detect if the error is real or simply
        // that there are no results for the requested hostname
        //
        // there should be much fewer errors than success, therefore it should
        // not be a big deal to not cache them
        if (error != null) {
          return callback(error)
        }

        cache.set(key, results)
        reportResults(all, results, callback)
      })
    }
  }
  cachedLookup.patchGlobal = function patchGlobal() {
    const previous = dns.lookup
    dns.lookup = cachedLookup
    return function restoreGlobal() {
      assert.strictEqual(dns.lookup, cachedLookup)
      dns.lookup = previous
    }
  }

  return cachedLookup
}
