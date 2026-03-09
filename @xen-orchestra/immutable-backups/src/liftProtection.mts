#!/usr/bin/env node

import { fileURLToPath } from 'node:url'
import * as Directory from './directory.mjs'
import { createLogger } from '@xen-orchestra/log'
import { listOlderTargets } from './fileIndex.mjs'
import cleanXoCache from './_cleanXoCache.mjs'
import loadConfig, { type AppConfig } from './_loadConfig.mjs'

// @xen-orchestra/log has no .d.ts — methods are added dynamically at runtime.
type XoLogger = { info: (msg: string, data?: object) => void; warn: (msg: string, data?: object) => void }

const { info, warn } = createLogger('xen-orchestra:immutable-backups:liftProtection') as unknown as XoLogger

async function* batchOf<T>(iterable: AsyncIterable<T>, size: number): AsyncGenerator<T[]> {
  let batch: T[] = []
  for await (const item of iterable) {
    batch.push(item)
    if (batch.length >= size) {
      yield batch
      batch = []
    }
  }
  if (batch.length > 0) yield batch
}

// Iterate the immutability index for a single remote and lift immutability on
// all entries whose protection period has expired.
export async function liftRemoteImmutability(
  immutabilityCachePath: string,
  immutabilityDuration: number
): Promise<void> {
  for await (const batch of batchOf(listOlderTargets(immutabilityCachePath, immutabilityDuration), 10)) {
    const targets = batch.map(({ target }) => target)
    await Directory.liftImmutabilityBatch(targets, immutabilityCachePath)
    await Promise.all(targets.map(cleanXoCache))
  }
}

// Lift immutability on all expired entries across every configured remote.
async function liftImmutability(remotes: AppConfig['remotes']): Promise<void> {
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
