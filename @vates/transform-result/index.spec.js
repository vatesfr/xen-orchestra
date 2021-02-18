/* eslint-env jest */

const { transformResult } = require('./')

describe('transformResult()', () => {
  it('transforms the result returned by the wrapped function', () => {
    const result = -1
    const fn = transformResult(() => result, Math.abs)
    expect(fn()).toBe(Math.abs(result))
  })
})
