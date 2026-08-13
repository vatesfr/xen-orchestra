import assert from 'assert/strict'
import test from 'node:test'
import TimeoutError from 'promise-toolbox/TimeoutError'

import BackupNg, { backupsListingRetryDelay } from './index.mjs'

const { afterEach, beforeEach, describe, it, mock } = test

// must be kept in sync with `index.mjs`
const LISTING_TIMEOUT = 30e3
const LISTING_DEBOUNCE = 60e3

// `mock.timers.tick()` is synchronous: yield to the event loop so that the promise continuations
// it scheduled have run before the assertions
const tick = async ms => {
  mock.timers.tick(ms)
  await new Promise(resolve => setImmediate(resolve))
}

const createBackupNg = () =>
  new BackupNg({
    config: { getDuration: () => LISTING_DEBOUNCE },
    hooks: { on() {} },
  })

describe('backupsListingRetryDelay()', () => {
  it('follows the Fibonacci sequence', () => {
    assert.deepEqual([0, 1, 2, 3, 4, 5].map(backupsListingRetryDelay), [30e3, 30e3, 60e3, 90e3, 150e3, 240e3])
  })

  it('is capped at 1h', () => {
    assert.equal(backupsListingRetryDelay(100), 60 * 60 * 1e3)
  })
})

describe('_listVmBackupsWithBackoff()', () => {
  beforeEach(() => {
    mock.timers.enable({ apis: ['setTimeout', 'Date'] })
  })

  afterEach(() => {
    mock.timers.reset()
  })

  it('starts a new listing when the previous one never settled', async () => {
    const backupNg = createBackupNg()
    let calls = 0
    backupNg._listVmBackupsOnRemoteUncached = () => {
      ++calls
      return new Promise(() => {})
    }

    const first = backupNg._listVmBackupsWithBackoff('remote')
    await tick(LISTING_TIMEOUT)
    assert.ok((await first).error instanceof TimeoutError)
    assert.equal(calls, 1)

    // the repository is in its retry delay, it is reported as failing without being listed again
    assert.ok((await backupNg._listVmBackupsWithBackoff('remote')).error instanceof TimeoutError)
    assert.equal(calls, 1)

    // the debounce entry has been dropped even though the underlying listing is still running:
    // this is what putting the timeout *inside* the debounced call buys
    await tick(LISTING_DEBOUNCE)
    backupNg._listVmBackupsWithBackoff('remote')
    assert.equal(calls, 2)
  })

  it('counts a single attempt for all the callers of a listing', async () => {
    const backupNg = createBackupNg()
    const error = new Error('unreachable')
    let calls = 0
    backupNg._listVmBackupsOnRemoteUncached = () => {
      ++calls
      return Promise.reject(error)
    }

    const results = await Promise.all([
      backupNg._listVmBackupsWithBackoff('remote'),
      backupNg._listVmBackupsWithBackoff('remote'),
      backupNg._listVmBackupsWithBackoff('remote'),
    ])

    assert.deepEqual(results, [{ error }, { error }, { error }])
    assert.equal(calls, 1)
    assert.equal(backupNg._backupsListingRetry.remote.attempt, 1)
  })

  it('does not count a caller which arrives after the listing failed', async () => {
    const backupNg = createBackupNg()
    const error = new Error('unreachable')
    let calls = 0
    backupNg._listVmBackupsOnRemoteUncached = () => {
      ++calls
      return Promise.reject(error)
    }

    assert.deepEqual(await backupNg._listVmBackupsWithBackoff('remote'), { error })
    assert.equal(backupNg._backupsListingRetry.remote.attempt, 1)

    // past the retry delay but still inside the debounce window: the caller gets the cached
    // rejection back and it must not be counted a second time
    await tick(backupsListingRetryDelay(0) + 1e3)
    assert.deepEqual(await backupNg._listVmBackupsWithBackoff('remote'), { error })
    assert.equal(calls, 1)
    assert.equal(backupNg._backupsListingRetry.remote.attempt, 1)
  })

  it('increases the retry delay on each consecutive failure', async () => {
    const backupNg = createBackupNg()
    const error = new Error('unreachable')
    backupNg._listVmBackupsOnRemoteUncached = () => Promise.reject(error)

    await backupNg._listVmBackupsWithBackoff('remote')
    assert.equal(backupNg._backupsListingRetry.remote.nextAttemptAt, Date.now() + backupsListingRetryDelay(0))

    // past both the retry delay and the debounce window
    await tick(LISTING_DEBOUNCE + 1e3)
    await backupNg._listVmBackupsWithBackoff('remote')
    assert.equal(backupNg._backupsListingRetry.remote.attempt, 2)
    assert.equal(backupNg._backupsListingRetry.remote.nextAttemptAt, Date.now() + backupsListingRetryDelay(1))
  })

  it('clears the retry state when the listing succeeds again', async () => {
    const backupNg = createBackupNg()
    const backupsByVm = { vm: [] }
    const error = new Error('unreachable')
    let failing = true
    backupNg._listVmBackupsOnRemoteUncached = () => (failing ? Promise.reject(error) : Promise.resolve(backupsByVm))

    assert.deepEqual(await backupNg._listVmBackupsWithBackoff('remote'), { error })
    failing = false

    // the repository is not listed again before its retry delay has passed
    assert.deepEqual(await backupNg._listVmBackupsWithBackoff('remote'), { error })

    await tick(LISTING_DEBOUNCE + 1e3)
    assert.deepEqual(await backupNg._listVmBackupsWithBackoff('remote'), { backupsByVm })
    assert.equal(backupNg._backupsListingRetry.remote, undefined)
  })
})

describe('invalidateVmBackupsListing()', () => {
  beforeEach(() => {
    mock.timers.enable({ apis: ['setTimeout', 'Date'] })
  })

  afterEach(() => {
    mock.timers.reset()
  })

  it('lists the repository again instead of waiting for its retry delay', async () => {
    const backupNg = createBackupNg()
    const backupsByVm = { vm: [] }
    let failing = true
    backupNg._listVmBackupsOnRemoteUncached = () =>
      failing ? Promise.reject(new Error('unreachable')) : Promise.resolve(backupsByVm)

    await backupNg._listVmBackupsWithBackoff('remote')
    failing = false

    backupNg.invalidateVmBackupsListing('remote')

    assert.deepEqual(await backupNg._listVmBackupsWithBackoff('remote'), { backupsByVm })
  })

  it('ignores the outcome of a listing which is still running', async () => {
    const backupNg = createBackupNg()
    let rejectListing
    backupNg._listVmBackupsOnRemoteUncached = () =>
      new Promise((resolve, reject) => {
        rejectListing = reject
      })

    const pending = backupNg._listVmBackupsWithBackoff('remote')
    backupNg.invalidateVmBackupsListing('remote')

    rejectListing(new Error('unreachable'))
    await pending

    // this listing no longer represents the state of the repository, it must not put it in a
    // retry delay
    assert.equal(backupNg._backupsListingRetry.remote, undefined)
  })
})
