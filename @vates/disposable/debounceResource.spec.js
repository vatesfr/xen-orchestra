/* eslint-env jest */

const { createDebounceResource } = require('./debounceResource')

jest.useFakeTimers()

describe('debounceResource()', () => {
  it('calls the resource disposer after 10 seconds', async () => {
    const debounceResource = createDebounceResource()
    const delay = 10e3
    const dispose = jest.fn()

    const resource = await debounceResource(
      Promise.resolve({
        value: '',
        dispose,
      }),
      delay
    )

    resource.dispose()

    expect(dispose).not.toBeCalled()

    jest.advanceTimersByTime(delay)

    expect(dispose).toBeCalled()
  })
})
