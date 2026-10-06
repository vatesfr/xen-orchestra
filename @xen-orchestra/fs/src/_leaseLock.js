import { createLogger } from '@xen-orchestra/log'
import { randomUUID } from 'node:crypto'

import { lockedError } from './_conditionalLock.js'

const { info, warn } = createLogger('xo:fs:leaseLock')

// how long a lease lasts without being renewed, in seconds, as Azure takes it
//
// the longest finite lease Azure allows: an infinite one would outlive a holder which crashed, and block the
// path until someone breaks it by hand
export const LEASE_DURATION = 60

// how often a holder renews its lease
//
// 4 renewals per lease: a holder survives a few slow or failed requests (provider latency, a busy event loop)
// without losing its lock
export const RENEW_INTERVAL = 15e3

/**
 * What `acquireLeaseLock()` needs from a storage: leases on the single blob which is the lock. Every method
 * acts on that blob.
 *
 * @typedef {object} LeaseLockStore
 * @property {() => Promise<void>} create creates the blob, empty, unless it exists; resolves in both cases
 * @property {(leaseId: string, duration: number) => Promise<boolean>} acquire leases the blob to `leaseId`
 * for `duration` seconds; resolves to `true` when it is leased to `leaseId`, including when it already was,
 * and to `false` when another lease is active; rejects with `code: 'ENOENT'` when the blob does not exist
 * @property {(leaseId: string) => Promise<boolean>} renew resolves to `false` when the lease is no longer
 * `leaseId`'s: another lease is active, or the blob is gone
 * @property {(leaseId: string) => Promise<void>} remove deletes the blob only while `leaseId` holds it;
 * resolves when it does not, or when the blob does not exist
 */

// leases the blob to `leaseId`, creating it first, or throws `lockedError(path)`
//
// The holder of the lock deletes the blob when it releases it: when that happens between `create()` and
// `acquire()`, one more attempt. Losing a second race means another contender got it.
async function take(store, path, leaseId, duration) {
  for (let attempt = 0; attempt < 2; ++attempt) {
    await store.create()

    let acquired
    try {
      acquired = await store.acquire(leaseId, duration)
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error
      }
      continue
    }

    if (acquired) {
      return
    }
    throw lockedError(path)
  }
  throw lockedError(path)
}

/**
 * Takes the lock `store` stands for and keeps it until the returned function is called; rejects with
 * `ELOCKED` when another holder has it; same contract as `LocalHandler#_lock()` — the release function
 * never rejects, and losing the lock while holding it is only logged.
 *
 * @param {LeaseLockStore} store
 * @param {string} path what is locked, used in errors and logs only
 * @param {object} [options]
 * @param {number} [options.renewInterval=RENEW_INTERVAL]
 * @param {number} [options.leaseDuration=LEASE_DURATION] in seconds
 * @returns {Promise<() => Promise<void>>}
 */
export async function acquireLeaseLock(
  store,
  path,
  { renewInterval = RENEW_INTERVAL, leaseDuration = LEASE_DURATION } = {}
) {
  // Azure requires a GUID. Proposing it, rather than letting Azure pick one, makes the retry of the SDK
  // harmless when the response of an acquisition is lost: acquiring with the ID of the active lease succeeds
  const leaseId = randomUUID()

  await take(store, path, leaseId, leaseDuration)
  let lastRenewal = Date.now()
  let lost = false
  let released = false
  let renewing = Promise.resolve()
  let timeout

  async function renew() {
    try {
      if (await store.renew(leaseId)) {
        lastRenewal = Date.now()
        return
      }

      // the lease is lost: someone took it after it expired, or the blob was deleted
      warn('lock compromised', { path })
      try {
        await take(store, path, leaseId, leaseDuration)
        lastRenewal = Date.now()
        info('compromised lock was reacquired', { path })
      } catch (error) {
        lost = true
        warn('compromised lock could not be reacquired', { error, path })
      }
    } catch (error) {
      // a failed request is not a lost lock: keep renewing. It is lost only if the lease expires and someone
      // takes it, which the next successful request finds out
      warn('lock could not be renewed', { error, path, sinceLastRenewal: Date.now() - lastRenewal })
    }
  }

  function schedule() {
    timeout = setTimeout(() => {
      renewing = renew().then(() => {
        if (!released && !lost) {
          schedule()
        }
      })
    }, renewInterval)
    timeout.unref()
  }

  schedule()

  return async function release() {
    released = true
    clearTimeout(timeout)

    try {
      // a renewal in flight which found the blob deleted would think the lock lost, and take it again
      await renewing
      // only deletes the blob while the lease is ours: after a lost lock, it is someone else's
      await store.remove(leaseId)
    } catch (error) {
      // the lease expires by itself, `leaseDuration` after its last renewal
      warn('lock could not be released', { error, path })
    }
  }
}
