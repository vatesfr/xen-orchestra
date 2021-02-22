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

  it('can apply from right to left', () => {
    expect(compose({ right: true }, add2, mul3)(5)).toBe(17)
  })

  it('accepts options with functions in an array', () => {
    expect(compose({ right: true }, [add2, mul3])(5)).toBe(17)
  })

  it('can compose async functions', async () => {
    expect(
      await compose(
        { async: true },
        async x => x + 2,
        async x => x * 3
      )(5)
    ).toBe(21)
  })

  it('forwards all args to first function', () => {
    expect.assertions(1)

    const expectedArgs = [Math.random(), Math.random()]
    compose(
      (...args) => {
        expect(args).toEqual(expectedArgs)
      },
      // add a second function to avoid the one function special case
      Function.prototype
    )(...expectedArgs)
  })

  it('forwards context to all functions', () => {
    expect.assertions(2)

    const expectedThis = {}
    compose(
      function () {
        expect(this).toBe(expectedThis)
      },
      function () {
        expect(this).toBe(expectedThis)
      }
    ).call(expectedThis)
  })
})
