import { describe, it } from 'node:test'
import { strict as assert } from 'assert'
import sinon from 'sinon'
import { withTimeout } from './utils'
import { TimeoutError } from 'promise-toolbox'

const TIMEOUT = 6e6

const clock = sinon.useFakeTimers()

describe('withTimeout()', () => {
  it(`throws in case of timeout`, async () => {
    let promiseFct = () => new Promise(() => {})
    promiseFct = withTimeout(promiseFct, TIMEOUT)
    const promise = promiseFct()
    clock.tick(TIMEOUT)
    await assert.rejects(promise, TimeoutError)
  })
})
