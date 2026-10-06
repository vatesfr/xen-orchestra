import { createLogger } from '@xen-orchestra/log'

const { debug, info, warn } = createLogger('xo:fs:lock')

// the error of proper-lockfile, which LocalHandler uses: callers and the documentation know this one
export function lockedError(path) {
  return Object.assign(new Error('Lock file is already being held'), { code: 'ELOCKED', file: path })
}

/**
 * Keeps a lock which was just taken until the returned function is called, with the contract of
 * `LocalHandler#_lock()`: losing the lock while holding it is only logged, and the release function never rejects.
 *
 * Every `interval` ms, one call at a time, `refresh()` keeps the lock, or resolves to `false` when it is no longer
 * ours: `reacquire()` then takes it back. The lock is given up only when `reacquire()` rejects with `ELOCKED`, as
 * another holder has it: any other error is a failed request, and the next refresh tries again.
 *
 * @param {string} path what is locked, used in logs only
 * @param {number} interval
 * @param {{ refresh: () => Promise<boolean>, reacquire: () => Promise<void>, release: () => Promise<void> }} lock
 * @returns {() => Promise<void>}
 */
export function holdLock(path, interval, { refresh, reacquire, release }) {
  let lastRefresh = Date.now()
  let lost = false
  let released = false
  let refreshing = Promise.resolve()
  let timeout

  async function keep() {
    try {
      if (await refresh()) {
        lastRefresh = Date.now()
        return
      }

      // someone took the lock over, or deleted it
      warn('lock compromised', { path })
      try {
        await reacquire()
        lastRefresh = Date.now()
        info('compromised lock was reacquired', { path })
      } catch (error) {
        lost = error.code === 'ELOCKED'
        warn('compromised lock could not be reacquired', { error, path })
      }
    } catch (error) {
      // a failed request is not a lost lock: it is lost only if it expires and someone takes it, which the next
      // successful request finds out; it repeats every interval while the store fails, hence debug
      debug('lock could not be refreshed', { error, path, sinceLastRefresh: Date.now() - lastRefresh })
    }
  }

  function schedule() {
    timeout = setTimeout(() => {
      refreshing = keep().then(() => {
        if (!released && !lost) {
          schedule()
        }
      })
    }, interval)
    timeout.unref()
  }

  schedule()

  return async () => {
    released = true
    clearTimeout(timeout)

    try {
      // a refresh in flight which found the lock deleted would think it lost, and take it again
      await refreshing
      await release()
    } catch (error) {
      warn('lock could not be released', { error, path })
    }
  }
}
