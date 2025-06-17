import { describe, it, beforeEach, afterEach, mock } from 'node:test'
import { strict as assert } from 'assert'
import sinon from 'sinon'
import { TimeoutError } from 'promise-toolbox'
import { withTimeout } from './utils'

const TIMEOUT = 6e6

describe('withTimeout()', () => {
  let clock

  beforeEach(() => {
    clock = sinon.useFakeTimers()
  })

  afterEach(() => {
    clock.restore()
    mock.reset()
  })

  it(`throws in case of timeout`, async () => {
    let promiseFct = () => new Promise(() => {})
    promiseFct = withTimeout(promiseFct, TIMEOUT)
    const promise = promiseFct()
    clock.tick(TIMEOUT)
    await assert.rejects(promise, TimeoutError)
  })

  it(`can success after timeout()`, async () => {
    let promiseFct = () =>
      new Promise(resolve => {
        setTimeout(() => resolve('done'), 5000)
      })
    const mockMethod = mock.fn(() => {})
    promiseFct = withTimeout(promiseFct, 2000, { onSuccessAfterTimeout: mockMethod })

    const promise = promiseFct()
    clock.tick(6000)
    await assert.rejects(promise, TimeoutError)
    assert.strictEqual(mockMethod.mock.callCount(), 1)
    assert.strictEqual(mockMethod.mock.calls[0].arguments[0], 'done')
  })

  it(`can fail after timeout()`, async () => {
    const testError = new Error('test')
    let promiseFct = () =>
      new Promise((_resolve, reject) => {
        setTimeout(() => {
          reject(testError)
        }, 5000)
      })

    const mockMethod = mock.fn(() => {})
    promiseFct = withTimeout(promiseFct, 2000, { onFailureAfterTimeout: mockMethod })
    const promise = promiseFct()
    clock.tick(TIMEOUT)
    await assert.rejects(promise, Error)

    assert.strictEqual(mockMethod.mock.callCount(), 1)
    assert.strictEqual(mockMethod.mock.calls[0].arguments[0], testError)
  })

  it(`can success before timeout()`, async () => {
    let promiseFct = () =>
      new Promise(resolve => {
        setTimeout(() => resolve('done'), 1000)
      })
    promiseFct = withTimeout(promiseFct, 2000)

    const promise = promiseFct()
    clock.tick(1000)
    const result = await promise
    assert.strictEqual(result, 'done')
  })

  it(`can fail before timeout()`, async () => {
    const testError = new Error('test')
    let promiseFct = () =>
      new Promise((_resolve, reject) => {
        setTimeout(() => reject(testError), 1000)
      })
    promiseFct = withTimeout(promiseFct, 2000)

    const promise = promiseFct()
    clock.tick(1000)
    assert.rejects(promise, testError)
  })
})
