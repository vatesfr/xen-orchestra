#!/usr/bin/env node

import * as Directory from './directory.mjs'
import { createLogger } from '@xen-orchestra/log'
import { listOlderTargets } from './_fileIndex.mjs'
import cleanXoCache from './_cleanXoCache.mjs'
import { RemoteConfig } from './_loadConfig.mjs'

const { warn } = createLogger('xen-orchestra:immutable-backups:liftProtection')

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
export async function liftImmutability(remotes: Record<string, RemoteConfig>): Promise<void> {
  for (const [remoteId, { indexPath, immutabilityDuration }] of Object.entries(remotes)) {
    await liftRemoteImmutability(indexPath, immutabilityDuration).catch(err =>
      warn('error during watchRemote', { err, remoteId, indexPath, immutabilityDuration })
    )
  }
}
