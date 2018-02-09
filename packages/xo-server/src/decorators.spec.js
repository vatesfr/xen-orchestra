/* eslint-env jest */

import { debounce } from './decorators'

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

    expect(i).toBe(0)

    foo.foo()
    expect(i).toBe(1)

    foo.foo()
    expect(i).toBe(1)

    setTimeout(() => {
      foo.foo()
      expect(i).toBe(2)

      done()
    }, 2e1)
  })
})
