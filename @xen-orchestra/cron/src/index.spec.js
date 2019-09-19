/* eslint-env jest */

import { createSchedule } from './'

describe('issues', () => {
  test('stop during async execution', async () => {
    let nCalls = 0
    let resolve, promise

    const job = createSchedule('* * * * *').createJob(() => {
      ++nCalls

      // eslint-disable-next-line promise/param-names
      promise = new Promise(r => {
        resolve = r
      })
      return promise
    })

    job.start()
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

    const job = createSchedule('* * * * *').createJob(() => {
      ++nCalls

      // eslint-disable-next-line promise/param-names
      promise = new Promise(r => {
        resolve = r
      })
      return promise
    })

    job.start()
    jest.runAllTimers()

    expect(nCalls).toBe(1)

    job.stop()
    job.start()

    resolve()
    await promise

    jest.runAllTimers()
    expect(nCalls).toBe(2)
  })
})
