/* eslint-env mocha */

import {expect} from 'chai'

// ===================================================================

import {autobind, debounce} from './decorators'

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
