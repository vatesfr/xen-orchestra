'use strict'

const assert = require('assert')
const { describe, it } = require('tap').mocha

const { decorateWith, decorateMethodsWith, perInstance } = require('./')

describe('decorateWith', () => {
  it('works', () => {
    const expectedArgs = [Math.random(), Math.random()]
    const expectedFn = Function.prototype
    const newFn = () => {}

    const decorator = decorateWith(function wrapper(fn, ...args) {
      assert.deepStrictEqual(fn, expectedFn)
      assert.deepStrictEqual(args, expectedArgs)

      return newFn
    }, ...expectedArgs)

    const descriptor = {
      configurable: true,
      enumerable: false,
      value: expectedFn,
      writable: true,
    }
    assert.deepStrictEqual(decorator({}, 'foo', descriptor), {
      ...descriptor,
      value: newFn,
    })
  })
})

describe('decorateMethodsWith', () => {
  it('works', () => {
    class C {
      foo() {}
      bar() {}
    }

    const expectedArgs = [Math.random(), Math.random()]
    const P = C.prototype

    const descriptors = Object.getOwnPropertyDescriptors(P)

    const newFoo = () => {}
    const newBar = () => {}

    decorateMethodsWith(C, {
      foo(method) {
        assert.strictEqual(arguments.length, 1)
        assert.strictEqual(method, P.foo)
        return newFoo
      },
      bar: [
        function (method, ...args) {
          assert.strictEqual(method, P.bar)
          assert.deepStrictEqual(args, expectedArgs)
          return newBar
        },
        ...expectedArgs,
      ],
    })

    const newDescriptors = Object.getOwnPropertyDescriptors(P)
    assert.deepStrictEqual(newDescriptors.foo, { ...descriptors.foo, value: newFoo })
    assert.deepStrictEqual(newDescriptors.bar, { ...descriptors.bar, value: newBar })
  })
})

describe('perInstance', () => {
  it('works', () => {
    let calls = 0

    const expectedArgs = [Math.random(), Math.random()]
    const expectedFn = Function.prototype
    function wrapper(fn, ...args) {
      assert.strictEqual(fn, expectedFn)
      assert.deepStrictEqual(args, expectedArgs)
      const i = ++calls
      return () => i
    }

    const wrapped = perInstance(expectedFn, wrapper, ...expectedArgs)

    // decorator is not called before decorated called
    assert.strictEqual(calls, 0)

    const o1 = {}
    const o2 = {}

    assert.strictEqual(wrapped.call(o1), 1)

    // the same decorated function is returned for the same instance
    assert.strictEqual(wrapped.call(o1), 1)

    // a new decorated function is returned for another instance
    assert.strictEqual(wrapped.call(o2), 2)
  })
})
