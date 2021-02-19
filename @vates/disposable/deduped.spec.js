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

  it('only disposes the source disposable when its all copies dispose', async () => {
    const dispose = jest.fn()
    const getResource = async () => ({
      value: '',
      dispose,
    })

    const dedupedGetResource = deduped(getResource)

    const { dispose: d1 } = await dedupedGetResource()
    const { dispose: d2 } = await dedupedGetResource()

    d1()

    expect(dispose).not.toHaveBeenCalled()

    d2()

    expect(dispose).toHaveBeenCalledTimes(1)
  })
})
