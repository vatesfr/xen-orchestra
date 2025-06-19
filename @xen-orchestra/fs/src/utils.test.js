import { describe, it, beforeEach, afterEach, mock } from 'node:test'
import { strict as assert } from 'assert'
import sinon from 'sinon'
import { TimeoutError } from 'promise-toolbox'
import { withTimeout } from './utils'

const TIMEOUT = 5000

describe('withTimeout()', () => {
  let clock

  beforeEach(() => {
    clock = sinon.useFakeTimers()
  })

  afterEach(() => {
    clock.restore()
    mock.reset()
  })

  it(`throws if function is synchronous`, async () => {
    let promiseFct = () => {
      return 'return value'
    }
    promiseFct = withTimeout(promiseFct, TIMEOUT)
    const promise = promiseFct()
    assert.rejects(promise, new Error('Function needs to be asynchronous.'))
  })

  it(`throws in case of timeout`, async () => {
    let promiseFct = () => new Promise(() => {})
    promiseFct = withTimeout(promiseFct, TIMEOUT)
    const promise = promiseFct()
    clock.tick(TIMEOUT)
    await assert.rejects(promise, new TimeoutError())
  })

  it(`can success after timeout()`, async () => {
    let promiseFct = () =>
      new Promise(resolve => {
        setTimeout(() => resolve('done'), TIMEOUT)
      })
    const mockMethod = mock.fn(() => {})
    promiseFct = withTimeout(promiseFct, TIMEOUT / 2, { onSuccessAfterTimeout: mockMethod })

    const promise = promiseFct()
    clock.tick(TIMEOUT)
    await assert.rejects(promise, new TimeoutError())
    assert.strictEqual(mockMethod.mock.callCount(), 1)
    assert.strictEqual(mockMethod.mock.calls[0].arguments[0], 'done')
  })

  it(`can fail after timeout()`, async () => {
    const testError = new Error('test')
    let promiseFct = () =>
      new Promise((_resolve, reject) => {
        setTimeout(() => {
          reject(testError)
        }, TIMEOUT)
      })

    const mockMethod = mock.fn(() => {})
    promiseFct = withTimeout(promiseFct, TIMEOUT / 2, { onFailureAfterTimeout: mockMethod })
    const promise = promiseFct()
    clock.tick(TIMEOUT)
    await assert.rejects(promise, testError)

    assert.strictEqual(mockMethod.mock.callCount(), 1)
    assert.strictEqual(mockMethod.mock.calls[0].arguments[0], testError)
  })

  it(`can success before timeout()`, async () => {
    let promiseFct = () =>
      new Promise(resolve => {
        setTimeout(() => resolve('done'), TIMEOUT)
      })
    promiseFct = withTimeout(promiseFct, TIMEOUT * 2)

    const promise = promiseFct()
    clock.tick(TIMEOUT)
    const result = await promise
    assert.strictEqual(result, 'done')
  })

  it(`can fail before timeout()`, async () => {
    const testError = new Error('test')
    let promiseFct = () =>
      new Promise((_resolve, reject) => {
        setTimeout(() => reject(testError), TIMEOUT)
      })
    promiseFct = withTimeout(promiseFct, TIMEOUT * 2)

    const promise = promiseFct()
    clock.tick(TIMEOUT)
    assert.rejects(promise, testError)
  })
})
