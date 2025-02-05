import { describe, it } from 'node:test'
import assert from 'node:assert'
import { Timeout } from './timeout.mts'

describe('Timeout class', () => {
  it('should reject a timeout with a negative or zero value ', async () => {
    // Create a mock async generator that never resolves
    const mockGenerator = (async function* () {
      yield 1
    })()

    assert.throws(() => new Timeout(mockGenerator, 0))
    assert.throws(() => new Timeout(mockGenerator, -10))
  })
  it('should resolve with the value from the source generator if it completes before the timeout', async () => {
    // Create a mock async generator that resolves immediately
    const mockGenerator = (async function* () {
      yield 1
    })()

    const timeout = new Timeout(mockGenerator, 100) // 100ms timeout

    const result = await timeout.next()
    assert.strictEqual(result.value, 1)
    assert.strictEqual(result.done, false)
  })

  it('should reject with a timeout error if the source generator takes too long', async () => {
    // Create a mock async generator that never resolves
    // eslint-disable-next-line require-yield
    const mockGenerator = (async function* () {
      await new Promise(() => {}) // Never resolves
    })()

    const timeout = new Timeout(mockGenerator, 10) // 10ms timeout

    await assert.rejects(timeout.next(), 'Expected timeout error was not thrown')
  })
  it('should allow iteration using for-await-of', async () => {
    // Create a mock async generator that yields values
    const mockGenerator: AsyncGenerator<number> = (async function* () {
      yield 1
      yield 2
      yield 3
    })()

    const timeout = new Timeout(mockGenerator, 100) // 100ms timeout

    const results: Array<number> = []
    for await (const value of timeout) {
      results.push(value as number)
    }

    assert.deepStrictEqual(results, [1, 2, 3])
  })

  it('should handle the throw method correctly', async () => {
    // Create a mock async generator with a throw method
    const mockGenerator = (async function* () {
      yield 1
    })()

    const timeout = new Timeout(mockGenerator, 100) // 100ms timeout

    await assert.rejects(timeout.throw(new Error('Test error')), 'Expected error was not thrown')
  })
})
