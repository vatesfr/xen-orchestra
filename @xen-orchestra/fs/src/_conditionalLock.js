import { createLogger } from '@xen-orchestra/log'
import { randomBytes } from 'node:crypto'

const { info, warn } = createLogger('xo:fs:conditionalLock')

// how often a holder rewrites its lock object
export const REFRESH_INTERVAL = 30e3

// how long a lock object may go without being rewritten before a contender takes it over
//
// 6 refresh intervals: a holder survives a few slow or failed requests (provider latency, a busy event
// loop) without losing its lock, and a holder which crashed blocks the path for 3 minutes at most
export const STALE_AFTER = 180e3

/**
 * What `acquireConditionalLock()` needs from a storage: conditional writes on the single object which
 * is the lock. Every method acts on that object.
 *
 * @typedef {object} ConditionalLockStore
 * @property {(body: string) => Promise<string | undefined>} create writes the object only if it does
 * not exist; resolves to its new ETag, or to `undefined` when the condition failed
 * @property {(body: string, etag: string) => Promise<string | undefined>} replace overwrites the object
 * only if its current ETag is `etag`; resolves to its new ETag, or to `undefined` when the condition
 * failed, including when the object does not exist
 * @property {() => Promise<{ etag: string, body: string, age: number } | undefined>} read resolves to
 * `undefined` when the object does not exist; `age` is the time since its last write, in ms, measured
 * on the storage's clock
 * @property {() => Promise<void>} remove deletes the object, unconditionally; resolves when it does
 * not exist
 *
 * `create()` and `replace()` reject with `code: 'ENOTSUP'` when the storage refuses the condition itself
 * (rather than failing it): `probeConditionalWrites()` reports such a storage as unsupported.
 */

// the error of proper-lockfile, which LocalHandler uses: callers and the documentation know this one
export function lockedError(path) {
  return Object.assign(new Error('Lock file is already being held'), { code: 'ELOCKED', file: path })
}

// a body this module did not write belongs to another holder
function idOf(body) {
  try {
    return JSON.parse(body)?.id
  } catch (error) {
    if (error instanceof SyntaxError) {
      return undefined
    }
    throw error
  }
}

// writes the lock object for `id` or throws `lockedError(path)`, and resolves to the ETag written
async function take(store, path, id, body, staleAfter) {
  let etag = await store.create(body)
  if (etag !== undefined) {
    return etag
  }

  const current = await store.read()
  if (current === undefined) {
    // released between `create()` and `read()`: one more attempt, losing a second race means another
    // contender got it
    etag = await store.create(body)
    if (etag !== undefined) {
      return etag
    }
    throw lockedError(path)
  }

  // the object is ours: `create()` succeeded but its response was lost, and the retry of the SDK was
  // refused by the very object it had written
  if (idOf(current.body) === id) {
    return current.etag
  }

  // its holder stopped rewriting it: take it over, unless another contender did, or the holder came back,
  // since `read()` — both change the ETag
  if (current.age > staleAfter) {
    etag = await store.replace(body, current.etag)
    if (etag !== undefined) {
      return etag
    }
  }

  throw lockedError(path)
}

/**
 * Takes the lock `store` stands for and keeps it until the returned function is called; rejects with
 * `ELOCKED` when another holder has it; same contract as `LocalHandler#_lock()` — the release function
 * never rejects, and losing the lock while holding it is only logged.
 *
 * @param {ConditionalLockStore} store
 * @param {string} path what is locked, used in errors and logs only
 * @param {object} [options]
 * @param {number} [options.refreshInterval=REFRESH_INTERVAL]
 * @param {number} [options.staleAfter=STALE_AFTER]
 * @returns {Promise<() => Promise<void>>}
 */
export async function acquireConditionalLock(
  store,
  path,
  { refreshInterval = REFRESH_INTERVAL, staleAfter = STALE_AFTER } = {}
) {
  const id = randomBytes(16).toString('hex')
  let seq = 0
  // every write has its own body, hence its own ETag: rewriting the same bytes would keep the same ETag
  // (S3 uses the MD5 of the content), and a contender which read the object just before that rewrite could
  // still replace it as stale
  const nextBody = () => JSON.stringify({ id, seq: seq++ })

  let etag = await take(store, path, id, nextBody(), staleAfter)
  let lastRefresh = Date.now()
  let lost = false
  let released = false
  let refreshing = Promise.resolve()
  let timeout

  async function refresh() {
    try {
      const newEtag = await store.replace(nextBody(), etag)
      if (newEtag !== undefined) {
        // eslint-disable-next-line require-atomic-updates
        etag = newEtag
        lastRefresh = Date.now()
        return
      }

      const current = await store.read()
      if (current !== undefined && idOf(current.body) === id) {
        // the replace succeeded but its response was lost, and the retry of the SDK was refused
        // eslint-disable-next-line require-atomic-updates
        etag = current.etag
        lastRefresh = Date.now()
        return
      }

      // the object is lost: someone took it over, or it was deleted
      warn('lock compromised', { path })
      try {
        // eslint-disable-next-line require-atomic-updates
        etag = await take(store, path, id, nextBody(), staleAfter)
        lastRefresh = Date.now()
        info('compromised lock was reacquired', { path })
      } catch (error) {
        lost = true
        warn('compromised lock could not be reacquired', { error, path })
      }
    } catch (error) {
      // a failed request is not a lost lock: keep refreshing. It is lost only if it goes stale and someone
      // takes it over, which the next successful request finds out
      warn('lock could not be refreshed', { error, path, sinceLastRefresh: Date.now() - lastRefresh })
    }
  }

  function schedule() {
    timeout = setTimeout(() => {
      refreshing = refresh().then(() => {
        if (!released && !lost) {
          schedule()
        }
      })
    }, refreshInterval)
    timeout.unref()
  }

  schedule()

  return async function release() {
    released = true
    clearTimeout(timeout)

    try {
      // a refresh in flight which found the object deleted would think the lock lost, and take it again
      await refreshing
      const current = await store.read()
      // only delete the object while it is ours: after a lost lock, it is someone else's
      //
      // Between `read()` and `remove()`, a contender can still take over an object which has gone stale, and
      // lose it to this deletion. Only a holder which already failed to refresh for `staleAfter` gets there;
      // closing the gap would take a conditional delete, which the store does not require.
      if (current !== undefined && idOf(current.body) === id) {
        await store.remove()
      }
    } catch (error) {
      warn('lock could not be released', { error, path })
    }
  }
}

// an ETag no object has: S3 ETags are quoted hex digests
const WRONG_ETAG = '"00000000000000000000000000000000"'

/**
 * Checks that a storage honours the conditional writes `acquireConditionalLock()` relies on.
 *
 * Not all S3-compatible providers support them, and one which ignored the conditions instead of
 * rejecting them would let two holders take the same lock. The probe creates, overwrites and deletes a
 * throwaway object to find out, and deletes it in every case.
 *
 * Rejects when a request fails for another reason (network, permissions): that says nothing about the
 * storage, the caller can probe again later.
 *
 * @param {ConditionalLockStore} store on a throwaway object, which must not exist
 * @returns {Promise<string | undefined>} why conditional writes cannot be relied on, or `undefined` when
 * they can
 */
export async function probeConditionalWrites(store) {
  try {
    const etag = await store.create(JSON.stringify({ probe: 0 }))
    if (etag === undefined) {
      return 'creating a new object failed its condition'
    }
    if ((await store.create(JSON.stringify({ probe: 1 }))) !== undefined) {
      return 'If-None-Match is ignored'
    }
    if ((await store.replace(JSON.stringify({ probe: 2 }), WRONG_ETAG)) !== undefined) {
      return 'If-Match is ignored'
    }
    if ((await store.replace(JSON.stringify({ probe: 3 }), etag)) === undefined) {
      return 'If-Match refuses the current ETag'
    }

    // on a versioned bucket, deleting an object leaves a delete marker, which must not count as an
    // existing object: a released lock has to be possible to take again
    await store.remove()
    if ((await store.create(JSON.stringify({ probe: 4 }))) === undefined) {
      return 'a deleted object cannot be created again'
    }

    return undefined
  } catch (error) {
    if (error.code !== 'ENOTSUP') {
      throw error
    }
    return `the storage refuses conditional writes: ${error.message}`
  } finally {
    try {
      await store.remove()
    } catch (error) {
      warn('the conditional writes probe could not be deleted', { error })
    }
  }
}
