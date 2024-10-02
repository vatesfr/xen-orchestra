'use strict'

// Even though the lib is compatible with Node >=8.3,
// the capture feature requires Node >=13.10
//
// eslint-disable-next-line n/no-unsupported-features/node-builtins
const { AsyncLocalStorage } = require('node:async_hooks')

const createTransport = require('./_createTransport.js')

// stored in the global context so that various versions of the library can interact.
const symbol = Symbol.for('@xen-orchestra/log/capture')
const asyncStorage = global[symbol] || (global[symbol] = new AsyncLocalStorage())

/**
 * Runs `fn` capturing all emitted logs (sync and async) and forward them to `onLog`.
 *
 * @template {(...args: any) => any} F
 * @param {undefined | (log: object) => void} onLog
 * @param {F} fn
 * @returns {ReturnType<F>}
 */
exports.captureLogs = function captureLogs(onLog, fn) {
  return asyncStorage.run(onLog, fn)
}

/**
 * Creates a transport for the `captureLogs` feature.
 *
 * @param {*} fallback - The transport to use as a fallback when not capturing
 * @returns {(log: object) => void}
 */
exports.createCaptureTransport = function createCaptureTransport(fallback) {
  fallback = fallback === undefined ? Function.prototype : createTransport(fallback)

  return function captureTransport(log) {
    ;(asyncStorage.getStore() || fallback)(log)
  }
}
