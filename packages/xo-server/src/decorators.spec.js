/* eslint-env jest */

import { debounce } from './decorators'

// ===================================================================

describe('debounce()', () => {
  let i

  class Foo {
    @debounce(10)
    foo () {
      ++i
    }
  }

  beforeEach(() => {
    i = 0
  })

  it('works', done => {
    const now = Date.now()
    const mockDate = jest.fn()
    mockDate.mockReturnValueOnce(now)
    Date.now = mockDate
    const foo = new Foo()

    expect(i).toBe(0)

    foo.foo()
    expect(i).toBe(1)

    mockDate.mockReturnValueOnce(now + 2)
    foo.foo()
    expect(i).toBe(1)

    mockDate.mockReturnValueOnce(now + 2 + 10)
    foo.foo()
    expect(i).toBe(2)
    done()
  })
})
