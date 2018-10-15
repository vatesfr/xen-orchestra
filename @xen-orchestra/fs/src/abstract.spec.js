/* eslint-env jest */

import AbstractHandler, { DEFAULT_TIMEOUT } from './abstract'
import { TimeoutError } from 'promise-toolbox'

class TestHandler extends AbstractHandler {
  constructor (impl) {
    super({ url: 'test://' })

    Object.keys(impl).forEach(method => {
      this[`_${method}`] = impl[method]
    })
  }
}

describe('rename()', () => {
  it(`return TimeoutError after ${DEFAULT_TIMEOUT} ms`, async () => {
    const testHandler = new TestHandler({
      rename: () => new Promise(() => {}),
    })

    const promise = testHandler.rename('oldPath', 'newPath')
    jest.advanceTimersByTime(DEFAULT_TIMEOUT)
    await expect(promise).rejects.toThrowError(TimeoutError)
  })
})

describe('list()', () => {
  it(`return TimeoutError after ${DEFAULT_TIMEOUT} ms`, async () => {
    const testHandler = new TestHandler({
      list: () => new Promise(() => {}),
    })

    const promise = testHandler.list()
    jest.advanceTimersByTime(DEFAULT_TIMEOUT)
    await expect(promise).rejects.toThrowError(TimeoutError)
  })
})

describe('openFile()', () => {
  it(`return TimeoutError after ${DEFAULT_TIMEOUT} ms`, async () => {
    const testHandler = new TestHandler({
      openFile: () => new Promise(() => {}),
    })

    const promise = testHandler.openFile('path')
    jest.advanceTimersByTime(DEFAULT_TIMEOUT)
    await expect(promise).rejects.toThrowError(TimeoutError)
  })
})

describe('closeFile()', () => {
  it(`return TimeoutError after ${DEFAULT_TIMEOUT} ms`, async () => {
    const testHandler = new TestHandler({
      closeFile: () => new Promise(() => {}),
    })

    const promise = testHandler.closeFile({ fd: undefined, path: '' })
    jest.advanceTimersByTime(DEFAULT_TIMEOUT)
    await expect(promise).rejects.toThrowError(TimeoutError)
  })
})

describe('unlink()', () => {
  it(`return TimeoutError after ${DEFAULT_TIMEOUT} ms`, async () => {
    const testHandler = new TestHandler({
      unlink: () => new Promise(() => {}),
    })

    const promise = testHandler.unlink('')
    jest.advanceTimersByTime(DEFAULT_TIMEOUT)
    await expect(promise).rejects.toThrowError(TimeoutError)
  })
})

describe('getSize()', () => {
  it(`return TimeoutError after ${DEFAULT_TIMEOUT} ms`, async () => {
    const testHandler = new TestHandler({
      getSize: () => new Promise(() => {}),
    })

    const promise = testHandler.getSize('')
    jest.advanceTimersByTime(DEFAULT_TIMEOUT)
    await expect(promise).rejects.toThrowError(TimeoutError)
  })
})
