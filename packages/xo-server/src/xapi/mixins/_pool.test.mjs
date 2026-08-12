import assert from 'assert/strict'
import test from 'node:test'
import { Task } from '@xen-orchestra/mixins/Tasks.mjs'

import poolMethods from './pool.mjs'

const { describe, it } = test

const SR_REF = 'OpaqueRef:sr'
const HOST_REF = 'OpaqueRef:host'

// the pool's clock, which is what the stamps are dated against
const NOW = 1_700_000_000
const stamp = (secondsAgo = 0) => String(NOW - secondsAgo)

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
}
const DAEMON_UP = { 'twinstor-version': '0.5.0', 'twinstor-alive': stamp() }

// the methods reach each other through `this`, so they are mixed in as they would be
const makeXapi = ({ SR = SYNCED, host = DAEMON_UP, getField } = {}) => ({
  ...poolMethods,
  otherConfigs: { SR, host },
  pool: { uuid: 'pool', master: HOST_REF },
  objects: {
    all: { [HOST_REF]: { $type: 'host', $ref: HOST_REF, other_config: host } },
    indexes: { type: { SR: {} } },
  },
  call: async () => String(NOW),
  getField:
    getField ??
    async function (type) {
      return this.otherConfigs[type]
    },
  getObject: ref => ({ name_label: ref }),
})

const makeGate = ({ stamps, timeLeft = 0, pollInterval = 5 } = {}) => ({
  srRefs: [SR_REF],
  hostRefs: [HOST_REF],
  stamps,
  timeLeft,
  pollInterval,
})

// the stamps a fully synced pool publishes, as `_readTwinstor` reads them
const CURRENT_STAMPS = [SYNCED['twinstor-updated-at'], DAEMON_UP['twinstor-alive']]

describe('_readTwinstor', function () {
  it('accepts a synced pool it has no previous state for', async function () {
    const result = await makeXapi()._readTwinstor(makeGate())
    assert.equal(result.blockedBy, undefined)
    assert.deepEqual(result.stamps, CURRENT_STAMPS)
  })

  // with no earlier state to compare against, only the stamp's age can say
  // whether the pool master is still speaking
  it('refuses a state which has aged out, when it has nothing to compare against', async function () {
    const xapi = makeXapi({ SR: { ...SYNCED, 'twinstor-updated-at': stamp(200) } })
    const result = await xapi._readTwinstor(makeGate())
    assert.match(result.blockedBy, /has not published its state recently/)

    const daemonDown = makeXapi({ host: { ...DAEMON_UP, 'twinstor-alive': stamp(200) } })
    assert.match((await daemonDown._readTwinstor(makeGate())).blockedBy, /daemon is not running/)
  })

  it('reports a running resync, with the SR and its progress', async function () {
    const result = await makeXapi({ SR: SYNCING })._readTwinstor(makeGate())
    assert.equal(result.blockedBy, `${SR_REF} is syncing`)
    assert.equal(result.progress, 30)
  })

  // the case this whole gate exists for: a host which just rebooted leaves the
  // record frozen on the `synced` which allowed its reboot, so only a state
  // published since then is a verdict on the pool as it is now
  it('refuses a state which has not been republished since the last one it accepted', async function () {
    const frozen = await makeXapi()._readTwinstor(makeGate({ stamps: CURRENT_STAMPS }))
    assert.match(frozen.blockedBy, /has not published its state since the last host rebooted/)

    const republished = await makeXapi()._readTwinstor(makeGate({ stamps: ['999', '999'] }))
    assert.equal(republished.blockedBy, undefined)
  })

  // DRBD keeps replicating in the kernel without the daemon, so the pair looks
  // healthy while a node has no supervision at all
  it('refuses to reboot while a daemon has stopped stamping, however healthy the storage', async function () {
    const xapi = makeXapi({ SR: { ...SYNCED, 'twinstor-updated-at': '2000' } })
    const result = await xapi._readTwinstor(makeGate({ stamps: CURRENT_STAMPS }))
    assert.equal(result.blockedBy, `the TWINSTOR daemon is not running on ${HOST_REF}`)
  })

  it('refuses a state whose keys disagree with each other', async function () {
    const xapi = makeXapi({ SR: { ...SYNCED, 'twinstor-storage-state': 'degraded' } })
    assert.equal((await xapi._readTwinstor(makeGate())).blockedBy, `${SR_REF} is degraded`)
  })

  it('fails at once on a schema it cannot interpret, rather than waiting out the timeout', async function () {
    await assert.rejects(
      () => makeXapi({ SR: { ...SYNCED, 'twinstor-schema': '2' } })._readTwinstor(makeGate()),
      /unsupported TWINSTOR schema/
    )
  })

  it('treats an unreadable state as not synced, not as a failure', async function () {
    const getField = async () => {
      throw new Error('ECONNRESET')
    }
    const result = await makeXapi({ getField })._readTwinstor(makeGate())
    assert.match(result.blockedBy, /could not be read/)
  })

  // parseDateTime throws on an input it does not recognize, which would kill a
  // rolling run instead of being retried on the next poll
  it('treats an unreadable pool clock as not synced either', async function () {
    const xapi = makeXapi()
    xapi.call = async () => undefined
    const result = await xapi._readTwinstor(makeGate())
    assert.match(result.blockedBy, /could not be read/)
  })
})

describe('assertTwinstorSynced', function () {
  it('does nothing on a pool without a TWINSTOR SR', async function () {
    // the fake pool advertises no SR, so the gate must not exist at all
    assert.equal(makeXapi()._getTwinstorGate(), undefined)
    await makeXapi().assertTwinstorSynced()
  })

  it('refuses an interactive reboot while the storage is catching up, rather than holding', async function () {
    const xapi = makeXapi({ SR: SYNCING })
    xapi.objects.indexes.type.SR = { [SR_REF]: { $ref: SR_REF, other_config: SYNCING } }

    await assert.rejects(
      () => xapi.assertTwinstorSynced(),
      error => error.code === 25 /* incorrectState */ && /is syncing/.test(error.data.actual)
    )
  })

  it('lets a reboot through on a synced pool', async function () {
    const xapi = makeXapi()
    xapi.objects.indexes.type.SR = { [SR_REF]: { $ref: SR_REF, other_config: SYNCED } }

    await xapi.assertTwinstorSynced()
  })
})

describe('_assertTwinstorSyncedAround', function () {
  const makeGatedXapi = otherConfig => {
    const xapi = makeXapi({ SR: otherConfig })
    xapi.objects.indexes.type.SR = { [SR_REF]: { $ref: SR_REF, other_config: otherConfig } }
    xapi.enabled = []
    xapi.enableHost = async id => xapi.enabled.push(id)
    return xapi
  }

  it('runs the operation on a synced pool, and checks again afterwards', async function () {
    const xapi = makeGatedXapi(SYNCED)
    let ran = false
    await xapi._assertTwinstorSyncedAround(HOST_REF, false, async () => {
      ran = true
    })
    assert.equal(ran, true)
    assert.deepEqual(xapi.enabled, [])
  })

  // an evacuation takes long enough for the peer to have gone away meanwhile
  it('refuses, and puts the host back in service, when the storage falls out of sync during the operation', async function () {
    const xapi = makeGatedXapi(SYNCED)

    await assert.rejects(
      () =>
        xapi._assertTwinstorSyncedAround(HOST_REF, false, async () => {
          xapi.otherConfigs.SR = SYNCING
        }),
      error => error.code === 25 /* incorrectState */ && /is syncing/.test(error.data.actual)
    )
    assert.deepEqual(xapi.enabled, [HOST_REF], 'the evacuated host was re-enabled')
  })

  it('does not check at all when the caller bypasses', async function () {
    const xapi = makeGatedXapi(SYNCING)
    let ran = false
    await xapi._assertTwinstorSyncedAround(HOST_REF, true, async () => {
      ran = true
    })
    assert.equal(ran, true)
  })

  it('refuses before running the operation when the storage is already out of sync', async function () {
    const xapi = makeGatedXapi(SYNCING)
    let ran = false
    await assert.rejects(() =>
      xapi._assertTwinstorSyncedAround(HOST_REF, false, async () => {
        ran = true
      })
    )
    assert.equal(ran, false, 'the host was not evacuated for a reboot which was never going to happen')
  })
})

describe('_waitForTwinstorSync', function () {
  it('does nothing on a pool without TWINSTOR', async function () {
    await makeXapi()._waitForTwinstorSync(undefined, {})
  })

  it('returns once the storage publishes a new synced state, and accepts it as the next baseline', async function () {
    const xapi = makeXapi({ SR: SYNCING })
    const gate = makeGate({ stamps: CURRENT_STAMPS, timeLeft: 60e3 })

    setTimeout(() => {
      xapi.otherConfigs.SR = { ...SYNCED, 'twinstor-updated-at': '2000' }
      xapi.otherConfigs.host = { ...DAEMON_UP, 'twinstor-alive': '2000' }
    }, 20)

    await xapi._waitForTwinstorSync(gate, { name: 'Waiting for TWINSTOR storage to be in sync' })
    assert.deepEqual(gate.stamps, ['2000', '2000'])
  })

  it('throws rather than proceeding when the sync does not complete in time', async function () {
    await assert.rejects(
      () => makeXapi({ SR: SYNCING })._waitForTwinstorSync(makeGate(), { name: 'Waiting' }),
      error => /did not get back in sync in time/.test(error.message) && /is syncing/.test(error.message)
    )
  })

  it('draws every wait from one shared budget', async function () {
    const xapi = makeXapi({ SR: SYNCING })
    const gate = makeGate({ timeLeft: 80, pollInterval: 20 })

    await assert.rejects(() => xapi._waitForTwinstorSync(gate, { name: 'Waiting' }))
    assert.equal(gate.timeLeft, 0, 'the first wait consumed the whole budget')

    // with nothing left, the next wait gives up at once rather than starting
    // another full timeout of its own
    const startedAt = Date.now()
    await assert.rejects(() => xapi._waitForTwinstorSync(gate, { name: 'Waiting' }))
    assert.ok(Date.now() - startedAt < 20, 'the second wait did not poll again')
  })

  it('gives up when the run is aborted, instead of waiting out the timeout', async function () {
    const parent = new Task({ properties: { name: 'Rolling pool reboot' } })
    const xapi = makeXapi({ SR: SYNCING })

    await assert.rejects(
      () =>
        parent.run(async () => {
          // abort while the gate is parked in its poll delay
          setTimeout(() => parent.abort('aborted by the user'), 20)
          return xapi._waitForTwinstorSync(makeGate({ timeLeft: 60 * 60e3 }), { name: 'Waiting' })
        }),
      error => error === 'aborted by the user'
    )
  })
})
