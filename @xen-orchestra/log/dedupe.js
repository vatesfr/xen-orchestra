'use strict'

const isEqual = require('lodash/isEqual')

const Log = require('./_Log')
const createTransport = require('./_createTransport')

exports.dedupe = function createDedupe({ timeout = 600e3, transport }) {
  transport = createTransport(transport)

  let prev = {}
  let n = 0

  let timeoutHandle
  function flush() {
    clearTimeout(timeoutHandle)
    transport(
      n === 1
        ? prev
        : new Log({ nDuplicates: n }, prev.level, prev.namespace, 'duplicates of the previous log were hidden')
    )
    n = 0
  }

  return function dedupeLog(log) {
    if (
      log.level === prev.level &&
      log.message === prev.message &&
      log.namespace === prev.namespace &&
      isEqual(log.data, prev.data)
    ) {
      if (n === 0) {
        timeoutHandle = setTimeout(flush, timeout)
      }
      ++n
      return
    }

    if (n !== 0) {
      flush()
    }
    prev = log
    return transport(log)
  }
}
