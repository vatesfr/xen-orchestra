import assert from 'node:assert'
import { suite, test } from 'node:test'
import { Synchronized } from './synchronized.mjs'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function* makeRangeGenerator(end = Infinity, progress = { yielded: 0 }, onYielded = (val: unknown) => {}) {
  for (let i = 0; i < end; i++) {
    await new Promise(resolve => setTimeout(resolve, 10))
    yield i
    onYielded(i)
    progress.yielded = i
  }
  return progress
}

async function consume(
  iterable: AsyncGenerator,
  delay = 2500,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onConsumed = (val: unknown, iterable: AsyncGenerator) => Promise.resolve(false)
) {
  for await (const val of iterable) {
    await new Promise(resolve => setTimeout(resolve, delay))
    if (await onConsumed(val, iterable)) {
      iterable.return(undefined)
    }
  }
}

suite('success', () => {
  test('if works with multiple consumer', async () => {
    const progress = { yielded: 0 }
    const generator = makeRangeGenerator(3, progress)
    const forker = new Synchronized(generator)
    const first = forker.fork('first')
    const second = forker.fork('second')
    await Promise.all([consume(first, 50), consume(second, 500)])
    assert.strictEqual(progress.yielded, 2)
  })

  test('if works with one consumer returning', async () => {
    const progress = { yielded: 0 }
    const generator = makeRangeGenerator(10, progress)
    const forker = new Synchronized(generator)
    const first = forker.fork('first')
    const second = forker.fork('second')
    await new Promise(resolve => setTimeout(resolve, 500))
    await Promise.all([
      consume(first, 1),
      consume(second, 1, async (val: unknown) => {
        return Promise.resolve(val === 2)
      }),
    ])
    assert.strictEqual(progress.yielded, 9)
  })
  test('if works with all consumers returning', async () => {
    const progress = { yielded: 0 }
    const generator = makeRangeGenerator(10, progress)
    const forker = new Synchronized(generator)
    const first = forker.fork('first')
    const second = forker.fork('second')
    await new Promise(resolve => setTimeout(resolve, 500))
    await Promise.all([
      consume(first, 1, async (val: unknown) => {
        return Promise.resolve(val === 5)
      }),
      consume(second, 1, async (val: unknown) => {
        return Promise.resolve(val === 2)
      }),
    ])
    assert.strictEqual(progress.yielded, 4)
  })
})

suite('error', () => {
  test('it fails all if error on source', async () => {
    const progress = { yielded: 0 }
    const generator = makeRangeGenerator(5, progress, (val: unknown) => {
      if (val === 2) {
        throw new Error('source stop')
      }
    })
    const forker = new Synchronized(generator)
    const first = forker.fork('first')
    const second = forker.fork('second')
    await assert.rejects(Promise.all([consume(first, 1), consume(second, 1)]))

    assert.strictEqual(progress.yielded, 1)
  })
  test('it flows until the end if one consumer throws', async () => {
    const progress = { yielded: 0 }
    const generator = makeRangeGenerator(10, progress)
    const forker = new Synchronized(generator)
    const first = forker.fork('first')
    const second = forker.fork('second')

    const firstConsume = consume(first, 1)

    const secondConsume = assert.rejects(() =>
      consume(second, 1, async (val: unknown, iterable) => {
        if (val === 1) {
          await iterable.throw(new Error('error on second'))
        }
        return false
      })
    )
    await Promise.allSettled([firstConsume, secondConsume])
    assert.strictEqual(progress.yielded, 9)
  })
  test('it throw if ALL consumer throws', async () => {
    const progress = { yielded: 0 }
    const generator = makeRangeGenerator(5, progress)
    const forker = new Synchronized(generator)
    const first = forker.fork('first')
    const second = forker.fork('second')

    const firstConsume = consume(first, 1, async (val: unknown, iterable) => {
      if (val === 3) {
        await iterable.throw(new Error('error on first'))
      }
      return false
    })
    const secondConsume = consume(second, 1, async (val: unknown, iterable) => {
      if (val === 1) {
        await iterable.throw(new Error('error on second'))
      }
      return false
    })

    await assert.rejects(Promise.all([firstConsume, secondConsume]))
    assert.strictEqual(progress.yielded, 2)
  })

  test('It should not allow a new fork after the start', async () => {
    const progress = { yielded: 0 }
    const generator = makeRangeGenerator(5, progress)
    const forker = new Synchronized(generator)
    const first = forker.fork('first')
    await first.next()
    assert.throws(() => forker.fork('second'))
  })
})
