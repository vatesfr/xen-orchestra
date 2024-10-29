'use strict'

const assert = require('assert')
const { describe, it } = require('node:test')

const { decorateClass, decorateWith, decorateMethodsWith, perInstance } = require('./')

const identity = _ => _

describe('decorateWith', () => {
  it('works', () => {
    const expectedArgs = [Math.random(), Math.random()]
    const expectedFn = Function.prototype
    const newFn = () => {}

    const decorator = decorateWith(
      function wrapper(fn, ...args) {
        assert.deepStrictEqual(fn, expectedFn)
        assert.deepStrictEqual(args, expectedArgs)

        return newFn
      },
      ...expectedArgs
    )

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

describe('decorateClass', () => {
  it('works', () => {
    class C {
      foo() {}
      bar() {}
      get baz() {}
      // eslint-disable-next-line accessor-pairs
      set qux(_) {}
    }

    const expectedArgs = [Math.random(), Math.random()]
    const P = C.prototype

    const descriptors = Object.getOwnPropertyDescriptors(P)

    const newFoo = () => {}
    const newBar = () => {}
    const newGetBaz = () => {}
    const newSetQux = _ => {}

    decorateClass(C, {
      foo(fn) {
        assert.strictEqual(arguments.length, 1)
        assert.strictEqual(fn, P.foo)
        return newFoo
      },
      bar: [
        function (fn, ...args) {
          assert.strictEqual(fn, P.bar)
          assert.deepStrictEqual(args, expectedArgs)
          return newBar
        },
        ...expectedArgs,
      ],
      baz: {
        get(fn) {
          assert.strictEqual(arguments.length, 1)
          assert.strictEqual(fn, descriptors.baz.get)
          return newGetBaz
        },
      },
      qux: {
        set: [
          function (fn, ...args) {
            assert.strictEqual(fn, descriptors.qux.set)
            assert.deepStrictEqual(args, expectedArgs)
            return newSetQux
          },
          ...expectedArgs,
        ],
      },
    })

    const newDescriptors = Object.getOwnPropertyDescriptors(P)
    assert.deepStrictEqual(newDescriptors.foo, { ...descriptors.foo, value: newFoo })
    assert.deepStrictEqual(newDescriptors.bar, { ...descriptors.bar, value: newBar })
    assert.deepStrictEqual(newDescriptors.baz, { ...descriptors.baz, get: newGetBaz })
    assert.deepStrictEqual(newDescriptors.qux, { ...descriptors.qux, set: newSetQux })
  })

  it('throws if using an accessor decorator for a method', function () {
    assert.throws(() =>
      decorateClass(
        class {
          foo() {}
        },
        { foo: { get: identity, set: identity } }
      )
    )
  })

  it('throws if using a method decorator for an accessor', function () {
    assert.throws(() =>
      decorateClass(
        class {
          get foo() {}
        },
        { foo: identity }
      )
    )
  })
})

it('decorateMethodsWith is an alias of decorateClass', function () {
  assert.strictEqual(decorateMethodsWith, decorateClass)
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
