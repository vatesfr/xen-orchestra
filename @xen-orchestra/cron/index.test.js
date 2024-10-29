'use strict'

const test = require('node:test')
const assert = require('assert').strict
const sinon = require('sinon')

const { createSchedule } = require('./')

const clock = sinon.useFakeTimers()

const wrap = value => () => value

test('issues', async t => {
  let originalDateNow
  originalDateNow = Date.now

  await t.test('stop during async execution', async () => {
    let nCalls = 0
    let resolve, promise

    const schedule = createSchedule('* * * * *')
    const job = schedule.createJob(() => {
      ++nCalls

      // eslint-disable-next-line promise/param-names
      promise = new Promise(r => {
        resolve = r
      })
      return promise
    })

    job.start()
    Date.now = wrap(+schedule.next(1)[0])
    clock.runAll()

    assert.strictEqual(nCalls, 1)

    job.stop()

    resolve()
    await promise

    clock.runAll()
    assert.strictEqual(nCalls, 1)
  })

  await t.test('stop then start during async job execution', async () => {
    let nCalls = 0
    let resolve, promise

    const schedule = createSchedule('* * * * *')
    const job = schedule.createJob(() => {
      ++nCalls

      // eslint-disable-next-line promise/param-names
      promise = new Promise(r => {
        resolve = r
      })
      return promise
    })

    job.start()
    Date.now = wrap(+schedule.next(1)[0])
    clock.runAll()

    assert.strictEqual(nCalls, 1)

    job.stop()
    job.start()

    resolve()
    await promise

    Date.now = wrap(+schedule.next(1)[0])
    clock.runAll()
    assert.strictEqual(nCalls, 2)
  })

  Date.now = originalDateNow
  originalDateNow = undefined
})
