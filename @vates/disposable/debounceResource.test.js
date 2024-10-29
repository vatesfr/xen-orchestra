'use strict'

const { describe, it } = require('node:test')
const { useFakeTimers, spy, assert } = require('sinon')

const { createDebounceResource } = require('./debounceResource')

const clock = useFakeTimers()

describe('debounceResource()', () => {
  it('calls the resource disposer after 10 seconds', async () => {
    const debounceResource = createDebounceResource()
    const delay = 10e3
    const dispose = spy()

    const resource = await debounceResource(
      Promise.resolve({
        value: '',
        dispose,
      }),
      delay
    )

    resource.dispose()

    assert.notCalled(dispose)

    clock.tick(delay)

    assert.called(dispose)
  })
})
