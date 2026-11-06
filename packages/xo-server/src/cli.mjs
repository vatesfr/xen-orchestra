#!/usr/bin/env node

import * as SourceMapSupport from 'source-map-support'
import Bluebird from 'bluebird'
import execPromise from 'exec-promise'
import { catchGlobalErrors } from '@xen-orchestra/log/configure'
import { createCachedLookup } from '@vates/cached-dns.lookup'
import { createLogger } from '@xen-orchestra/log'

import main from './index.mjs'

// ===================================================================

// https://expressjs.com/en/advanced/best-practice-performance.html#set-node_env-to-production
if (process.env.NODE_ENV === undefined) {
  process.env.NODE_ENV = 'production'
}

// Better stack traces if possible.
try {
  SourceMapSupport.install({
    handleUncaughtExceptions: false,
  })
} catch (_) {}

// Enable `async_hooks` because it's used by `@xen-orchestra/backups/Task` via `node-zone`
//
// See: http://bluebirdjs.com/docs/api/promise.config.html#async-hooks
Bluebird.config({ asyncHooks: true })

// Node 26's global `fetch` calls `Promise.withResolvers()`, which Bluebird 3.7.2, its last release, lacks
Bluebird.withResolvers = function withResolvers() {
  let resolve, reject
  const promise = new this((resolve_, reject_) => {
    resolve = resolve_
    reject = reject_
  })
  return { promise, resolve, reject }
}

// Use Bluebird for all promises as it provides better performance and
// less memory usage.
global.Promise = Bluebird

catchGlobalErrors(createLogger('xo:xo-server'))

createCachedLookup().patchGlobal()

execPromise(main)
