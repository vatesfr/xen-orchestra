#!/usr/bin/env node

import { createLogger } from '@xen-orchestra/log'
import loadConfig from './_loadConfig.mjs'
import { watchRemote } from './remote.mjs'
import { liftImmutability } from './liftProtection.mjs'

const { info, warn } = createLogger('xen-orchestra:immutable-backups:remote')

const { liftEvery, remotes } = await loadConfig()
for (const [remoteId, remote] of Object.entries(remotes)) {
  watchRemote(remoteId, remote).catch(err => warn('error during watchRemote', { err, remoteId, remote }))
}

if (liftEvery !== undefined && liftEvery > 0) {
  info('setup watcher for immutability lifting', {})
  setInterval(async () => {
    await liftImmutability(remotes).catch(error => warn('error while lifting immutability', error))
  }, liftEvery)
} else {
  await liftImmutability(remotes)
}
