import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { Semaphore } from './semaphore.mjs'

describe('Semaphore', () => {
  it('rejects a non-positive-integer concurrency', () => {
    assert.throws(() => new Semaphore(0), /positive integer/)
    assert.throws(() => new Semaphore(-1), /positive integer/)
    assert.throws(() => new Semaphore(1.5), /positive integer/)
  })

  it('runs tasks immediately while under the limit', async () => {
    const semaphore = new Semaphore(2)
    const started: Array<number> = []
    await Promise.all(
      [0, 1].map(i =>
        semaphore.run(async () => {
          started.push(i)
        })
      )
    )
    assert.deepEqual(started.sort(), [0, 1])
  })

  it('caps concurrency and admits the next task as soon as a slot frees', async () => {
    const semaphore = new Semaphore(2)
    let inFlight = 0
    let maxInFlight = 0
    const releases: Array<() => void> = []

    const run = () =>
      semaphore.run(async () => {
        inFlight++
        maxInFlight = Math.max(maxInFlight, inFlight)
        await new Promise<void>(resolve => releases.push(resolve))
        inFlight--
      })

    const tasks = [run(), run(), run(), run()]
    // let the first batch (2, the concurrency limit) start
    await new Promise(resolve => setImmediate(resolve))
    assert.equal(inFlight, 2)
    assert.equal(releases.length, 2)

    while (releases.length > 0) {
      releases.shift()!()
      await new Promise(resolve => setImmediate(resolve))
    }
    await Promise.all(tasks)

    assert.equal(maxInFlight, 2)
  })

  it('propagates a task failure without leaking its slot', async () => {
    const semaphore = new Semaphore(1)
    await assert.rejects(
      semaphore.run(async () => {
        throw new Error('boom')
      }),
      /boom/
    )
    // the slot must have been released despite the failure
    let ran = false
    await semaphore.run(async () => {
      ran = true
    })
    assert.equal(ran, true)
  })
})
