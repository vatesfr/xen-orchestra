#!/usr/bin/env node
// @ts-check

import { fileURLToPath } from 'node:url'
import * as Directory from './directory.mjs'
import { createLogger } from '@xen-orchestra/log'
import { listOlderTargets } from './fileIndex.mjs'
import cleanXoCache from './_cleanXoCache.mjs'
import loadConfig from './_loadConfig.mjs'

/**
 * @xen-orchestra/log has no .d.ts — methods are added dynamically at runtime.
 * @typedef {{ info: (msg: string, data?: object) => void, warn: (msg: string, data?: object) => void }} XoLogger
 */

const { info, warn } = /** @type {XoLogger} */ (
  /** @type {unknown} */ (createLogger('xen-orchestra:immutable-backups:liftProtection'))
)

/**
 * Iterate the immutability index for a single remote and lift immutability on
 * all entries whose protection period has expired.
 * @param {string} immutabilityCachePath - Root of the immutability index directory
 * @param {number} immutabilityDuration  - Retention duration in milliseconds
 * @returns {Promise<void>}
 */
/**
 * @template T
 * @param {AsyncIterable<T>} iterable
 * @param {number} size
 * @returns {AsyncGenerator<T[]>}
 */
async function* batchOf(iterable, size) {
  let batch = /** @type {T[]} */ ([])
  for await (const item of iterable) {
    batch.push(item)
    if (batch.length >= size) {
      yield batch
      batch = []
    }
  }
  if (batch.length > 0) yield batch
}

export async function liftRemoteImmutability(/** @type {string} */ immutabilityCachePath, /** @type {number} */ immutabilityDuration) {
  for await (const batch of batchOf(listOlderTargets(immutabilityCachePath, immutabilityDuration), 10)) {
    const targets = batch.map(({ target }) => target)
    await Directory.liftImmutabilityBatch(targets, immutabilityCachePath)
    await Promise.all(targets.map(cleanXoCache))
  }
}

/**
 * Lift immutability on all expired entries across every configured remote.
 * @param {import('./_loadConfig.mjs').AppConfig['remotes']} remotes
 * @returns {Promise<void>}
 */
async function liftImmutability(remotes) {
  for (const [remoteId, { indexPath, immutabilityDuration }] of Object.entries(remotes)) {
    liftRemoteImmutability(indexPath, immutabilityDuration).catch(err =>
      warn('error during watchRemote', { err, remoteId, indexPath, immutabilityDuration })
    )
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { liftEvery, remotes } = await loadConfig()

  if (liftEvery !== undefined && liftEvery > 0) {
    info('setup watcher for immutability lifting')
    setInterval(async () => {
      await liftImmutability(remotes).catch(warn)
    }, liftEvery)
  } else {
    await liftImmutability(remotes)
  }
}
