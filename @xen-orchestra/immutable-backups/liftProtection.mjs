#!/usr/bin/env node

import * as Directory from './directory.mjs'
import { createLogger } from '@xen-orchestra/log'
import { listOlderTargets } from './fileIndex.mjs'
import cleanXoCache from './_cleanXoCache.mjs'
import loadConfig from './_loadConfig.mjs'

const { info, warn } = createLogger('xen-orchestra:immutable-backups:liftProtection')

async function liftRemoteImmutability(immutabilityCachePath, immutabilityDuration) {
  for await (const { target } of listOlderTargets(immutabilityCachePath, immutabilityDuration)) {
    await Directory.liftImmutability(target, immutabilityCachePath)
    await cleanXoCache(target)
  }
}

async function liftImmutability(remotes) {
  for (const [remoteId, { indexPath, immutabilityDuration }] of Object.entries(remotes)) {
    liftRemoteImmutability(indexPath, immutabilityDuration).catch(err =>
      warn('error during watchRemote', { err, remoteId, indexPath, immutabilityDuration })
    )
  }
}

const { liftEvery, remotes } = await loadConfig()

if (liftEvery > 0) {
  info('setup watcher for immutability lifting')
  setInterval(async () => {
    await liftImmutability(remotes).catch(warn)
  }, liftEvery)
} else {
  await liftImmutability(remotes)
}
