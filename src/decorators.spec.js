/* eslint-env mocha */

import expect from 'must'

// ===================================================================

import {autobind, debounce, deferrable} from './decorators'

// ===================================================================

describe('autobind', function () {
  class Foo {
    @autobind
    getFoo () {
      return this
    }
  }

  it('returns a bound instance for a method', function () {
    const foo = new Foo()
    const {getFoo} = foo

    expect(getFoo()).to.equal(foo)
  })

  it('returns the same bound instance each time', function () {
    const foo = new Foo()

    expect(foo.getFoo).to.equal(foo.getFoo)
  })

  it('works with multiple instances of the same class', function () {
    const foo1 = new Foo()
    const foo2 = new Foo()

    const {getFoo: getFoo1} = foo1
    const {getFoo: getFoo2} = foo2

    expect(getFoo1()).to.equal(foo1)
    expect(getFoo2()).to.equal(foo2)
  })
})

// -------------------------------------------------------------------

describe('debounce', function () {
  let i

  class Foo {
    @debounce(1e1)
    foo () {
      ++i
    }
  }

  beforeEach(function () {
    i = 0
  })

  it('works', function (done) {
    const foo = new Foo()

    expect(i).to.equal(0)

    foo.foo()
    expect(i).to.equal(1)

    foo.foo()
    expect(i).to.equal(1)

    setTimeout(function () {
      foo.foo()
      expect(i).to.equal(2)

      done()
    }, 2e1)
  })
})

// -------------------------------------------------------------------

describe('deferrable', () => {
  it('works with normal termination', () => {
    let i = 0
    const fn = deferrable(defer => {
      i += 2
      defer(() => { i -= 2 })

      i *= 2
      defer(() => { i /= 2 })

      return i
    })

    expect(fn()).to.equal(4)
    expect(i).to.equal(0)
  })

  it('defer.clear() removes previous deferred', () => {
    let i = 0
    const fn = deferrable(defer => {
      i += 2
      defer(() => { i -= 2 })

      defer.clear()

      i *= 2
      defer(() => { i /= 2 })

      return i
    })

    expect(fn({ clear: true })).to.equal(4)
    expect(i).to.equal(2)
  })

  it('works with exception', () => {
    let i = 0
    const fn = deferrable(defer => {
      i += 2
      defer(() => { i -= 2 })

      i *= 2
      defer(() => { i /= 2 })

      throw i
    })

    expect(() => fn({ throw: true })).to.throw(4)
    expect(i).to.equal(0)
  })
})
