import assert from 'assert/strict'
import test from 'node:test'

import Remotes, { remoteInfoRetryDelay } from './remotes.mjs'

const { describe, it } = test

// the constructor only registers hooks (callbacks are never invoked here), so a
// stub app with a no-op `hooks.on` is enough; `_remotes` is set per-test
const makeRemotes = () => new Remotes({ hooks: { on() {} } })

describe('remoteInfoRetryDelay', function () {
  it('is fibonacci-spaced, scaled by the 5s base', function () {
    assert.deepEqual(
      [0, 1, 2, 3, 4, 5, 6, 7].map(remoteInfoRetryDelay),
      [5e3, 5e3, 10e3, 15e3, 25e3, 40e3, 65e3, 105e3]
    )
  })

  it('caps at 1h', function () {
    assert.equal(remoteInfoRetryDelay(100), 60 * 60 * 1e3)
  })
})

describe('getAllRemotesInfo', function () {
  it('returns immediately without awaiting a hanging remote fetch', async function () {
    const remotes = makeRemotes()
    const remote = { id: 'a', enabled: true }
    remotes._remotes = { get: async () => [remote] }
    // a fetch that never settles: if getAllRemotesInfo awaited it, this test would time out
    remotes._fetchRemoteInfo = () => new Promise(() => {})

    const result = await remotes.getAllRemotesInfo()
    assert.equal(result, remotes._remotesInfo)
  })

  it('skips a broken remote on subsequent polls and schedules a retry', async function (t) {
    t.mock.timers.enable({ apis: ['setTimeout'] }) // keep the scheduled retry inert

    const remotes = makeRemotes()
    const remote = { id: 'a', enabled: true }
    remotes._remotes = { get: async () => [remote], first: async () => remote }

    let fetchCalls = 0
    remotes._fetchRemoteInfo = async () => {
      fetchCalls += 1
      throw new Error('broken')
    }

    // first refresh fails -> a background retry is scheduled
    await remotes._refreshRemoteInfo(remote)
    assert.equal(fetchCalls, 1)
    assert.notEqual(remotes._remotesInfoRetry.a, undefined)
    assert.equal(remotes._remotesInfoRetry.a.attempt, 1)

    // a client poll must now skip the broken remote: no extra fetch
    await remotes.getAllRemotesInfo()
    assert.equal(fetchCalls, 1)
  })

  it('widens the retry delay on each consecutive failure', async function (t) {
    t.mock.timers.enable({ apis: ['setTimeout'] })

    const remotes = makeRemotes()
    const remote = { id: 'a', enabled: true }
    remotes._remotes = { get: async () => [remote], first: async () => remote }
    remotes._fetchRemoteInfo = async () => {
      throw new Error('broken')
    }

    await remotes._refreshRemoteInfo(remote)
    assert.equal(remotes._remotesInfoRetry.a.attempt, 1)

    // simulate the scheduled retry firing and failing again
    await remotes._refreshRemoteInfo(remote)
    assert.equal(remotes._remotesInfoRetry.a.attempt, 2)
  })

  it('clears retry state and caches info once the remote recovers', async function (t) {
    t.mock.timers.enable({ apis: ['setTimeout'] })

    const remotes = makeRemotes()
    const remote = { id: 'a', enabled: true }
    remotes._remotes = { get: async () => [remote], first: async () => remote }

    let healthy = false
    remotes._fetchRemoteInfo = async r => {
      if (!healthy) {
        throw new Error('broken')
      }
      remotes._remotesInfo[r.id] = { size: 42 }
    }

    await remotes._refreshRemoteInfo(remote) // fails -> retry scheduled
    assert.notEqual(remotes._remotesInfoRetry.a, undefined)

    healthy = true
    await remotes._refreshRemoteInfo(remote) // simulate the retry firing -> success
    assert.equal(remotes._remotesInfoRetry.a, undefined)
    assert.deepEqual(remotes._remotesInfo.a, { size: 42 })
  })
})
