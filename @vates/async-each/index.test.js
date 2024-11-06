'use strict'

const { describe, it, beforeEach } = require('node:test')
const assert = require('assert').strict
const { spy } = require('sinon')

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
        const iteratee = spy(async () => {})

        await asyncEach.call(thisArg, iterable, iteratee, { concurrency: 1 })

        assert.deepStrictEqual(
          iteratee.thisValues,
          Array.from(values, () => thisArg)
        )
        assert.deepStrictEqual(
          iteratee.args,
          Array.from(values, (value, index) => [value, index, iterable])
        )
      })
      ;[1, 2, 4].forEach(concurrency => {
        it('respects a concurrency of ' + concurrency, async () => {
          let running = 0

          await asyncEach(
            values,
            async () => {
              ++running
              assert.deepStrictEqual(running <= concurrency, true)
              await randomDelay()
              --running
            },
            { concurrency }
          )
        })
      })

      it('stops on first error when stopOnError is true', async () => {
        const tracker = new assert.CallTracker()

        const error = new Error()
        const iteratee = tracker.calls((_, i) => {
          if (i === 1) {
            throw error
          }
        }, 2)
        assert.deepStrictEqual(
          await rejectionOf(asyncEach(iterable, iteratee, { concurrency: 1, stopOnError: true })),
          error
        )

        tracker.verify()
      })

      it('rejects AggregateError when stopOnError is false', async () => {
        const errors = []
        const iteratee = spy(() => {
          const error = new Error()
          errors.push(error)
          throw error
        })

        const error = await rejectionOf(asyncEach(iterable, iteratee, { stopOnError: false }))
        assert.deepStrictEqual(error.errors, errors)
        assert.deepStrictEqual(
          iteratee.args,
          Array.from(values, (value, index) => [value, index, iterable])
        )
      })

      it('can be interrupted with an AbortSignal', async () => {
        const tracker = new assert.CallTracker()

        const ac = new AbortController()
        const iteratee = tracker.calls((_, i) => {
          if (i === 1) {
            ac.abort()
          }
        }, 2)
        await assert.rejects(asyncEach(iterable, iteratee, { concurrency: 1, signal: ac.signal }), {
          message: 'asyncEach aborted',
        })

        tracker.verify()
      })
    })
  )
})
