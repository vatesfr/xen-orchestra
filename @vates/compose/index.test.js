'use strict'

const { describe, it } = require('test')
const assert = require('node:assert').strict

const { compose } = require('./')

const add2 = x => x + 2
const mul3 = x => x * 3

describe('compose()', () => {
  it('throws when no functions is passed', () => {
    assert.throws(() => compose(), TypeError)
    assert.throws(() => compose([]), TypeError)
  })

  it('applies from left to right', () => {
    assert.strictEqual(compose(add2, mul3)(5), 21)
  })

  it('accepts functions in an array', () => {
    assert.strictEqual(compose([add2, mul3])(5), 21)
  })

  it('can apply from right to left', () => {
    assert.strictEqual(compose({ right: true }, add2, mul3)(5), 17)
  })

  it('accepts options with functions in an array', () => {
    assert.strictEqual(compose({ right: true }, [add2, mul3])(5), 17)
  })

  it('can compose async functions', async () => {
    assert.strictEqual(
      await compose(
        { async: true },
        async x => x + 2,
        async x => x * 3
      )(5),
      21
    )
  })

  it('forwards all args to first function', () => {
    const expectedArgs = [Math.random(), Math.random()]
    compose(
      (...args) => {
        assert.deepEqual(args, expectedArgs)
      },
      // add a second function to avoid the one function special case
      Function.prototype
    )(...expectedArgs)
  })

  it('forwards context to all functions', () => {
    const expectedThis = {}
    compose(
      function () {
        assert.strictEqual(this, expectedThis)
      },
      function () {
        assert.strictEqual(this, expectedThis)
      }
    ).call(expectedThis)
  })
})
