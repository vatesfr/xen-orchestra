#!/usr/bin/env node
// @ts-check

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
async function liftRemoteImmutability(immutabilityCachePath, immutabilityDuration) {
  for await (const { target } of listOlderTargets(immutabilityCachePath, immutabilityDuration)) {
    await Directory.liftImmutability(target, immutabilityCachePath)
    await cleanXoCache(target)
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

const { liftEvery, remotes } = await loadConfig()

if (liftEvery !== undefined && liftEvery > 0) {
  info('setup watcher for immutability lifting')
  setInterval(async () => {
    await liftImmutability(remotes).catch(warn)
  }, liftEvery)
} else {
  await liftImmutability(remotes)
}
