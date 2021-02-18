/* eslint-env jest */

const { compose } = require('./')

const add2 = x => x + 2
const mul3 = x => x * 3

describe('compose()', () => {
  it('throws when no functions is passed', () => {
    expect(() => compose()).toThrow(TypeError)
    expect(() => compose([])).toThrow(TypeError)
  })

  it('applies from left to right', () => {
    expect(compose(add2, mul3)(5)).toBe(21)
  })

  it('accepts functions in an array', () => {
    expect(compose([add2, mul3])(5)).toBe(21)
  })
})
