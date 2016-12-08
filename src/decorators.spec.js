/* eslint-env mocha */

import expect from 'must'

// ===================================================================

import {debounce} from './decorators'

// ===================================================================

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
