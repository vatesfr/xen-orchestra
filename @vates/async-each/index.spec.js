'use strict'

/* eslint-env jest */

const { asyncEach } = require('./')

const randomDelay = (max = 10) =>
  new Promise(resolve => {
    setTimeout(resolve, Math.floor(Math.random() * max + 1))
  })

const rejectionOf = p =>
  new Promise((resolve, reject) => {
    p.then(reject, resolve)
  })

describe('asyncEach', () => {
  const thisArg = 'qux'
  const values = ['foo', 'bar', 'baz']

  Object.entries({
    'sync iterable': () => values,
    'async iterable': async function* () {
      for (const value of values) {
        await randomDelay()
        yield value
      }
    },
  }).forEach(([what, getIterable]) =>
    describe('with ' + what, () => {
      let iterable
      beforeEach(() => {
        iterable = getIterable()
      })

      it('works', async () => {
        const iteratee = jest.fn(async () => {})

        await asyncEach.call(thisArg, iterable, iteratee, { concurrency: 1 })

        expect(iteratee.mock.instances).toEqual(Array.from(values, () => thisArg))
        expect(iteratee.mock.calls).toEqual(Array.from(values, (value, index) => [value, index, iterable]))
      })
      ;[1, 2, 4].forEach(concurrency => {
        it('respects a concurrency of ' + concurrency, async () => {
          let running = 0

          await asyncEach(
            values,
            async () => {
              ++running
              expect(running).toBeLessThanOrEqual(concurrency)
              await randomDelay()
              --running
            },
            { concurrency }
          )
        })
      })

      it('stops on first error when stopOnError is true', async () => {
        const error = new Error()
        const iteratee = jest.fn((_, i) => {
          if (i === 1) {
            throw error
          }
        })

        expect(await rejectionOf(asyncEach(iterable, iteratee, { concurrency: 1, stopOnError: true }))).toBe(error)
        expect(iteratee).toHaveBeenCalledTimes(2)
      })

      it('rejects AggregateError when stopOnError is false', async () => {
        const errors = []
        const iteratee = jest.fn(() => {
          const error = new Error()
          errors.push(error)
          throw error
        })

        const error = await rejectionOf(asyncEach(iterable, iteratee, { stopOnError: false }))
        expect(error.errors).toEqual(errors)
        expect(iteratee.mock.calls).toEqual(Array.from(values, (value, index) => [value, index, iterable]))
      })

      it('can be interrupted with an AbortSignal', async () => {
        const ac = new AbortController()
        const iteratee = jest.fn((_, i) => {
          if (i === 1) {
            ac.abort()
          }
        })

        await expect(asyncEach(iterable, iteratee, { concurrency: 1, signal: ac.signal })).rejects.toThrow(
          'asyncEach aborted'
        )
        expect(iteratee).toHaveBeenCalledTimes(2)
      })
    })
  )
})
