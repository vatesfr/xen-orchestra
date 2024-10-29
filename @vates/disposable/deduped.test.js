'use strict'

const { describe, it } = require('node:test')
const { spy, assert } = require('sinon')

const { deduped } = require('./deduped')

describe('deduped()', () => {
  it('calls the resource function only once', async () => {
    const value = {}
    const getResource = spy(async () => ({
      value,
      dispose: Function.prototype,
    }))

    const dedupedGetResource = deduped(getResource)

    const { value: v1 } = await dedupedGetResource()
    const { value: v2 } = await dedupedGetResource()

    assert.calledOnce(getResource)
    assert.match(v1, value)
    assert.match(v2, value)
  })

  it('only disposes the source disposable when its all copies dispose', async () => {
    const dispose = spy()
    const getResource = async () => ({
      value: '',
      dispose,
    })

    const dedupedGetResource = deduped(getResource)

    const { dispose: d1 } = await dedupedGetResource()
    const { dispose: d2 } = await dedupedGetResource()

    d1()

    assert.notCalled(dispose)

    d2()

    assert.calledOnce(dispose)
  })

  it('works with sync factory', () => {
    const value = {}
    const dispose = spy()
    const dedupedGetResource = deduped(() => ({ value, dispose }))

    const d1 = dedupedGetResource()
    assert.match(d1.value, value)

    const d2 = dedupedGetResource()
    assert.match(d2.value, value)

    d1.dispose()

    assert.notCalled(dispose)

    d2.dispose()

    assert.calledOnce(dispose)
  })

  it('no race condition on dispose before async acquisition', async () => {
    const dispose = spy()
    const dedupedGetResource = deduped(async () => ({ value: 42, dispose }))

    const d1 = await dedupedGetResource()

    dedupedGetResource()

    d1.dispose()

    assert.notCalled(dispose)
  })
})
