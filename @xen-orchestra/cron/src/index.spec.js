/* eslint-env jest */

import { createSchedule } from './'

const wrap = value => () => value

describe('issues', () => {
  let originalDateNow
  beforeAll(() => {
    originalDateNow = Date.now
  })
  afterAll(() => {
    Date.now = originalDateNow
    originalDateNow = undefined
  })

  test('stop during async execution', async () => {
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
    jest.runAllTimers()

    expect(nCalls).toBe(1)

    job.stop()

    resolve()
    await promise

    jest.runAllTimers()
    expect(nCalls).toBe(1)
  })

  test('stop then start during async job execution', async () => {
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
    jest.runAllTimers()

    expect(nCalls).toBe(1)

    job.stop()
    job.start()

    resolve()
    await promise

    Date.now = wrap(+schedule.next(1)[0])
    jest.runAllTimers()
    expect(nCalls).toBe(2)
  })
})
