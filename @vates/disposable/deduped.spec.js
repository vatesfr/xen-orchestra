/* eslint-env jest */

const { deduped } = require('./deduped')

describe('deduped()', () => {
  it('calls the resource function only once', async () => {
    const value = {}
    const getResource = jest.fn(async () => ({
      value,
      dispose: Function.prototype,
    }))

    const dedupedGetResource = deduped(getResource)

    const { value: v1 } = await dedupedGetResource()
    const { value: v2 } = await dedupedGetResource()

    expect(getResource).toHaveBeenCalledTimes(1)
    expect(v1).toBe(value)
    expect(v2).toBe(value)
  })
})
