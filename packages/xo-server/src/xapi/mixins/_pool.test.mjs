import assert from 'assert/strict'
import test from 'node:test'
import { Task } from '@xen-orchestra/mixins/Tasks.mjs'

import poolMethods from './pool.mjs'

const { describe, it } = test

const SR_REF = 'OpaqueRef:sr'
const HOST_REF = 'OpaqueRef:host'
const NOW = Date.now()
const stamp = (msAgo = 0) => String(Math.round((NOW - msAgo) / 1e3))

const SYNCED = {
  'twinstor-schema': '1',
  'twinstor-managed': 'true',
  'twinstor-synced': 'true',
  'twinstor-storage-state': 'synced',
  'twinstor-sync-pct': '100',
  'twinstor-updated-at': stamp(),
}
const SYNCING = {
  ...SYNCED,
  'twinstor-synced': 'false',
  'twinstor-storage-state': 'syncing',
  'twinstor-sync-pct': '30',
  'twinstor-sync-eta': '300',
}
const DAEMON_UP = { 'twinstor-version': '0.5.0', 'twinstor-alive': stamp() }

// the methods reach each other through `this`, so they are mixed in as they would be
const makeFakeXapi = ({ sr = SYNCED, host = DAEMON_UP, getField } = {}) => ({
  ...poolMethods,
  pool: { uuid: 'pool' },
  getField: getField ?? (async type => (type === 'SR' ? sr : host)),
  getObject: ref => ({ name_label: ref }),
})

const makeTwinstorState = ({ publishedBefore = new Map(), syncTimeLeft = 0, pollInterval = 5 } = {}) => ({
  srRefs: [SR_REF],
  hostRefs: [HOST_REF],
  publishedBefore,
  syncTimeLeft,
  pollInterval,
})

describe('_probeTwinstor', function () {
  it('is ready on a synced pool with a live daemon', async function () {
    const probe = await makeFakeXapi()._probeTwinstor(makeTwinstorState())
    assert.equal(probe.isReady, true)
    assert.equal(probe.published.get(SR_REF), Number(SYNCED['twinstor-updated-at']) * 1e3)
  })

  it('is not ready while a replica is catching up', async function () {
    const probe = await makeFakeXapi({ sr: SYNCING })._probeTwinstor(makeTwinstorState())
    assert.equal(probe.isReady, false)
    assert.equal(probe.progress, 30)
    assert.match(probe.blockedBy, /catching up/)
  })

  // a host which just rebooted leaves the advertisement frozen on `synced=true`
  it('refuses an advertisement not republished since the last reboot', async function () {
    const publishedAt = Number(SYNCED['twinstor-updated-at']) * 1e3

    const frozen = await makeFakeXapi()._probeTwinstor(
      makeTwinstorState({ publishedBefore: new Map([[SR_REF, publishedAt]]) })
    )
    assert.equal(frozen.isReady, false)
    assert.match(frozen.blockedBy, /has not published its state since the last host rebooted/)

    const republished = await makeFakeXapi()._probeTwinstor(
      makeTwinstorState({ publishedBefore: new Map([[SR_REF, publishedAt - 1e3]]) })
    )
    assert.equal(republished.isReady, true)
  })

  it('refuses to reboot while a daemon is down, however healthy the storage', async function () {
    const probe = await makeFakeXapi({ host: { 'twinstor-version': '0.5.0' } })._probeTwinstor(makeTwinstorState())
    assert.equal(probe.isReady, false)
    assert.match(probe.blockedBy, /daemon is not running/)
  })

  it('fails immediately on a schema it cannot interpret', async function () {
    await assert.rejects(
      () => makeFakeXapi({ sr: { ...SYNCED, 'twinstor-schema': '2' } })._probeTwinstor(makeTwinstorState()),
      /unsupported TWINSTOR schema/
    )
  })

  it('treats an unreadable advertisement as not synced, not as an abort', async function () {
    const getField = async () => {
      throw new Error('ECONNRESET')
    }
    const probe = await makeFakeXapi({ getField })._probeTwinstor(makeTwinstorState())
    assert.equal(probe.isReady, false)
    assert.match(probe.blockedBy, /could not be read/)
  })
})

describe('_waitForTwinstorSync', function () {
  it('does nothing on a pool without TWINSTOR', async function () {
    const published = await makeFakeXapi()._waitForTwinstorSync(
      { ...makeTwinstorState(), srRefs: [], hostRefs: [] },
      {}
    )
    assert.equal(published.size, 0)
  })

  it('returns the accepted advertisement without waiting when already synced', async function () {
    const published = await makeFakeXapi()._waitForTwinstorSync(makeTwinstorState(), {})
    assert.equal(published.get(SR_REF), Number(SYNCED['twinstor-updated-at']) * 1e3)
  })

  it('throws rather than proceeding when the sync does not complete in time', async function () {
    await assert.rejects(
      () =>
        makeFakeXapi({ sr: SYNCING })._waitForTwinstorSync(makeTwinstorState(), {
          name: 'Waiting for TWINSTOR storage to be in sync',
        }),
      error =>
        /did not get back in sync in time/.test(error.message) && /catching up \(30%, ~5 min left\)/.test(error.message)
    )
  })

  it('draws every wait from one shared budget', async function () {
    const xapi = makeFakeXapi({ sr: SYNCING })
    const twinstor = makeTwinstorState({ syncTimeLeft: 80, pollInterval: 20 })
    const properties = { name: 'Waiting for TWINSTOR storage to be in sync' }

    await assert.rejects(() => xapi._waitForTwinstorSync(twinstor, properties))
    assert.equal(twinstor.syncTimeLeft, 0, 'the first wait consumed the whole budget')

    // with nothing left, the next wait gives up at once rather than starting
    // another full timeout of its own
    const startedAt = Date.now()
    await assert.rejects(() => xapi._waitForTwinstorSync(twinstor, properties))
    assert.ok(Date.now() - startedAt < 20, 'the second wait did not poll again')
  })

  it('gives up when the run is aborted, instead of waiting out the timeout', async function () {
    const parent = new Task({ properties: { name: 'Rolling pool reboot' } })
    const xapi = makeFakeXapi({ sr: SYNCING })

    await assert.rejects(
      () =>
        parent.run(async () => {
          // abort while the gate is parked in its poll delay
          setTimeout(() => parent.abort('aborted by the user'), 20)
          return xapi._waitForTwinstorSync(makeTwinstorState({ syncTimeLeft: 60 * 60e3 }), {
            name: 'Waiting for TWINSTOR storage to be in sync',
          })
        }),
      error => error === 'aborted by the user'
    )
  })
})

describe('_assertTwinstorReady', function () {
  it('accepts a synced pool', async function () {
    await makeFakeXapi()._assertTwinstorReady(makeTwinstorState())
  })

  it('refuses a run upfront when the storage is not already redundant', async function () {
    await assert.rejects(
      () => makeFakeXapi({ sr: SYNCING })._assertTwinstorReady(makeTwinstorState()),
      error => error.code === 25 /* incorrectState */ && /catching up/.test(error.data.actual)
    )
  })
})
