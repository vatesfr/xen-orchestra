/* eslint-env jest */

import createSelector from './'

const noop = () => {}

describe('createSelector', () => {
  it('calls input selectors with this and arguments', () => {
    const thisArg = {}
    const args = ['arg1', 'arg2']
    const foo = jest.fn()

    createSelector({ foo }, ({ foo }) => {}).apply(thisArg, args)

    expect(foo.mock.instances).toEqual([thisArg])
    expect(foo.mock.calls).toEqual([args])
  })

  it('calls input selectors only when accessed', () => {
    const foo = jest.fn()
    createSelector({ foo }, inputs => {
      expect(foo.mock.calls.length).toBe(0)
      noop(inputs.foo)
      expect(foo.mock.calls.length).toBe(1)
    })()
  })

  it('does not call the input selectors if this arguments did not change', () => {
    const foo = jest.fn()
    const selector = createSelector({ foo }, ({ foo }) => {})

    selector('arg1')
    expect(foo.mock.calls.length).toBe(1)

    selector('arg1')
    expect(foo.mock.calls.length).toBe(1)

    selector('arg1', 'arg2')
    expect(foo.mock.calls.length).toBe(2)

    selector.call({}, 'arg1', 'arg2')
    expect(foo.mock.calls.length).toBe(3)
  })

  it('does not call the transform if inputs did not change', () => {
    const transform = jest.fn(({ foo }) => {})
    const selector = createSelector(
      {
        foo: () => 'foo',
      },
      transform
    )

    selector({})
    expect(transform.mock.calls.length).toBe(1)

    selector({})
    expect(transform.mock.calls.length).toBe(1)
  })

  it('computes only the necessary inputs to determine if transform should be called', () => {
    let foo = 'foo 1'
    const bar = 'bar 1'
    const inputs = {
      foo: jest.fn(() => foo),
      bar: jest.fn(() => bar),
    }
    const transform = jest.fn(inputs => {
      if (inputs.foo !== 'foo 1') {
        return inputs.bar
      }
    })
    const selector = createSelector(inputs, transform)

    selector({})
    expect(inputs.foo.mock.calls.length).toBe(1)
    expect(inputs.bar.mock.calls.length).toBe(0)

    selector({})
    expect(inputs.foo.mock.calls.length).toBe(2)
    expect(inputs.bar.mock.calls.length).toBe(0)

    foo = 'foo 2'

    selector({})
    expect(inputs.foo.mock.calls.length).toBe(3)
    expect(inputs.bar.mock.calls.length).toBe(1)

    foo = 'foo 1'

    selector({})
    expect(inputs.foo.mock.calls.length).toBe(4)
    expect(inputs.bar.mock.calls.length).toBe(1)

    selector({})
    expect(inputs.foo.mock.calls.length).toBe(5)
    expect(inputs.bar.mock.calls.length).toBe(1)
  })
})
