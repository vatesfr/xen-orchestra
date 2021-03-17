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

  it('works with sync factory', () => {
    const value = {}
    const dispose = jest.fn()
    const dedupedGetResource = deduped(() => ({ value, dispose }))

    const d1 = dedupedGetResource()
    expect(d1.value).toBe(value)

    const d2 = dedupedGetResource()
    expect(d2.value).toBe(value)

    d1.dispose()

    expect(dispose).not.toHaveBeenCalled()

    d2.dispose()

    expect(dispose).toHaveBeenCalledTimes(1)
  })

  it('no race condition on dispose before async acquisition', async () => {
    const dispose = jest.fn()
    const dedupedGetResource = deduped(async () => ({ value: 42, dispose }))

    const d1 = await dedupedGetResource()

    dedupedGetResource()

    d1.dispose()

    expect(dispose).not.toHaveBeenCalled()
  })
})
