/* eslint-env mocha */

import expect from 'must'

// ===================================================================

import {autobind, debounce, deferrable} from './decorators'

// ===================================================================

describe('autobind()', () => {
  class Foo {
    @autobind
    getFoo () {
      return this
    }
  }

  it('returns a bound instance for a method', () => {
    const foo = new Foo()
    const { getFoo } = foo

    expect(getFoo()).to.equal(foo)
  })

  it('returns the same bound instance each time', () => {
    const foo = new Foo()

    expect(foo.getFoo).to.equal(foo.getFoo)
  })

  it('works with multiple instances of the same class', () => {
    const foo1 = new Foo()
    const foo2 = new Foo()

    const getFoo1 = foo1.getFoo
    const getFoo2 = foo2.getFoo

    expect(getFoo1()).to.equal(foo1)
    expect(getFoo2()).to.equal(foo2)
  })
})

// -------------------------------------------------------------------

describe('debounce()', () => {
  let i

  class Foo {
    @debounce(1e1)
    foo () {
      ++i
    }
  }

  beforeEach(() => {
    i = 0
  })

  it('works', done => {
    const foo = new Foo()

    expect(i).to.equal(0)

    foo.foo()
    expect(i).to.equal(1)

    foo.foo()
    expect(i).to.equal(1)

    setTimeout(() => {
      foo.foo()
      expect(i).to.equal(2)

      done()
    }, 2e1)
  })
})

// -------------------------------------------------------------------

describe('deferrable()', () => {
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

  it('defer.clear() removes previous deferreds', () => {
    let i = 0
    const fn = deferrable(defer => {
      i += 2
      defer(() => { i -= 2 })

      defer.clear()

      i *= 2
      defer(() => { i /= 2 })

      return i
    })

    expect(fn()).to.equal(4)
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

    expect(() => fn()).to.throw(4)
    expect(i).to.equal(0)
  })

  it('works with promise resolution', async () => {
    let i = 0
    const fn = deferrable(async defer => {
      i += 2
      defer(() => { i -= 2 })

      i *= 2
      defer(() => { i /= 2 })

      // Wait a turn of the events loop.
      await Promise.resolve()

      return i
    })

    await expect(fn()).to.eventually.equal(4)
    expect(i).to.equal(0)
  })

  it('works with promise rejection', async () => {
    let i = 0
    const fn = deferrable(async defer => {
      // Wait a turn of the events loop.
      await Promise.resolve()

      i += 2
      defer(() => { i -= 2 })

      i *= 2
      defer(() => { i /= 2 })

      // Wait a turn of the events loop.
      await Promise.resolve()

      throw i
    })

    await expect(fn()).to.reject.to.equal(4)
    expect(i).to.equal(0)
  })
})
