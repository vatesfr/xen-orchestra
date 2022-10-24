'use strict'

const { describe, it, beforeEach } = require('test')
const { spy, assert } = require('sinon')
const { rejects } = require('tap')

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

        assert.match(
          iteratee.thisValues,
          Array.from(values, () => thisArg)
        )
        assert.match(
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
              assert.match(running <= concurrency, true)
              await randomDelay()
              --running
            },
            { concurrency }
          )
        })
      })

      it('stops on first error when stopOnError is true', async () => {
        const error = new Error()
        const iteratee = spy((_, i) => {
          if (i === 1) {
            throw error
          }
        })

        assert.match(await rejectionOf(asyncEach(iterable, iteratee, { concurrency: 1, stopOnError: true })), error)
        assert.calledTwice(iteratee)
      })

      it('rejects AggregateError when stopOnError is false', async () => {
        const errors = []
        const iteratee = spy(() => {
          const error = new Error()
          errors.push(error)
          throw error
        })

        const error = await rejectionOf(asyncEach(iterable, iteratee, { stopOnError: false }))
        assert.match(error.errors, errors)
        assert.match(
          iteratee.args,
          Array.from(values, (value, index) => [value, index, iterable])
        )
      })

      it('can be interrupted with an AbortSignal', async () => {
        const ac = new AbortController()
        const iteratee = spy((_, i) => {
          if (i === 1) {
            ac.abort()
          }
        })

        await rejects(asyncEach(iterable, iteratee, { concurrency: 1, signal: ac.signal }), 'asyncEach aborted')
        assert.calledTwice(iteratee)
      })
    })
  )
})
