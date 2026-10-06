import { createLogger } from '@xen-orchestra/log'
import { randomBytes } from 'node:crypto'
import { pTimeout } from 'promise-toolbox'

import { holdLock, lockedError } from './_holdLock.js'

const { warn } = createLogger('xo:fs:conditionalLock')

// how often a holder rewrites its lock object
export const REFRESH_INTERVAL = 30e3

// how long a lock object may go without being rewritten before a contender takes it over
//
// 6 refresh intervals: a holder survives a few slow or failed requests (provider latency, a busy event
// loop) without losing its lock, and a holder which crashed blocks the path for 3 minutes at most
export const STALE_AFTER = 180e3

// how long a refresh waits for each store request: a hung request counts as a failed refresh, which must
// happen well before the lock goes stale, so that the holder notices a lost lock in time
export const REFRESH_TIMEOUT = 60e3

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
 * on the storage's clock; rejects with `code: 'ENOTSUP'` when the storage does not return the ETag, body
 * and date of the object
 * @property {() => Promise<void>} remove deletes the object, unconditionally; resolves when it does
 * not exist
 *
 * `create()`, `replace()` and `read()` reject with `code: 'ENOTSUP'` when the storage refuses the condition
 * itself (rather than failing it), or does not return what a lock needs: `probeConditionalWrites()` reports
 * such a storage as unsupported.
 */

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
async function take(store, path, id, body) {
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
  if (current.age > STALE_AFTER) {
    etag = await store.replace(body, current.etag)
    if (etag !== undefined) {
      return etag
    }

    // the takeover may have landed with its response lost, and the retry of the SDK refused by the object it
    // had written: the object is ours
    const written = await store.read()
    if (written === undefined) {
      // released between `replace()` and `read()`: one more attempt, as in the create branch
      etag = await store.create(body)
      if (etag !== undefined) {
        return etag
      }
    } else if (idOf(written.body) === id) {
      return written.etag
    }
  }

  throw lockedError(path)
}

/**
 * Takes the lock `store` stands for, and holds it with `holdLock()` until the returned function is called;
 * rejects with `ELOCKED` when another holder has it.
 *
 * @param {ConditionalLockStore} store
 * @param {string} path what is locked, used in errors and logs only
 * @returns {Promise<() => Promise<void>>}
 */
export async function acquireConditionalLock(store, path) {
  const id = randomBytes(16).toString('hex')
  let seq = 0
  // every write has its own body, hence its own ETag: rewriting the same bytes would keep the same ETag
  // (S3 uses the MD5 of the content), and a contender which read the object just before that rewrite could
  // still replace it as stale
  const nextBody = () => JSON.stringify({ id, seq: seq++ })

  // what refreshes use: every request is bounded, `take()` included, while acquiring stays unbounded
  //
  // a `take()` which times out may still land, leaving a lock object no holder knows of, held until
  // STALE_AFTER: waiting costs nothing here, since the caller has not started writing. A refresh can land the
  // same way, but its holder finds that object again through the read in `refresh()`, and a takeover from
  // `reacquire()` is found by `release()`, which waits for the requests still in flight
  const requests = new Set()
  function bounded(promise) {
    const settled = promise.then(
      () => {},
      () => {}
    )
    requests.add(settled)
    settled.then(() => requests.delete(settled))
    return pTimeout.call(promise, REFRESH_TIMEOUT)
  }
  const refreshStore = {
    create: body => bounded(store.create(body)),
    replace: (body, etag) => bounded(store.replace(body, etag)),
    read: () => bounded(store.read()),
  }

  let etag = await take(store, path, id, nextBody())

  // `holdLock()` runs one refresh at a time, and the release after the last one: no other write of `etag` can
  // land between reading it and the assignments below, which come after an `await`
  return holdLock(path, REFRESH_INTERVAL, {
    async refresh() {
      const newEtag = await refreshStore.replace(nextBody(), etag)
      if (newEtag !== undefined) {
        // eslint-disable-next-line require-atomic-updates -- see above
        etag = newEtag
        return true
      }

      // the replace may have landed with its response lost, and the retry of the SDK been refused
      const current = await refreshStore.read()
      if (current === undefined || idOf(current.body) !== id) {
        return false
      }
      // eslint-disable-next-line require-atomic-updates -- see above
      etag = current.etag
      return true
    },
    async reacquire() {
      etag = await take(refreshStore, path, id, nextBody())
    },
    // only deletes the object while it is ours: after a lost lock, it is someone else's
    //
    // Between `read()` and `remove()`, a contender can still take over an object which has gone stale, and
    // lose it to this deletion. Only a holder which already failed to refresh for `STALE_AFTER` gets there;
    // closing the gap would take a conditional delete, which the store does not require.
    //
    // A request which timed out in `reacquire()` may still land after this read, and leave an object of this
    // holder which nothing would delete until STALE_AFTER: the read waits for the requests in flight, bounded
    // like a refresh since a store request may hang
    async release() {
      await pTimeout.call(Promise.all(requests), REFRESH_TIMEOUT, () => {})
      const current = await store.read()
      if (current !== undefined && idOf(current.body) === id) {
        await store.remove()
      }
    },
  })
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
 * @returns {Promise<string | undefined>} why conditional writes cannot be relied on, or `undefined` when they can
 */
export async function probeConditionalWrites(store) {
  try {
    const etag = await store.create(JSON.stringify({ probe: 0 }))
    if (etag === undefined) {
      return 'creating a new object failed its condition, or returned no ETag'
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
    // the lock reads the object back, which needs its ETag, body and date
    await store.read()

    // on a versioned bucket, deleting an object leaves a delete marker, which must not count as an
    // existing object: a released lock has to be possible to take again
    await store.remove()
    if ((await store.create(JSON.stringify({ probe: 4 }))) === undefined) {
      return 'a deleted object cannot be created again'
    }
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
