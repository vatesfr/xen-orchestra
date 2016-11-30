/* eslint-env mocha */

import expect from 'must'

// ===================================================================

import {autobind, debounce} from './decorators'

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
