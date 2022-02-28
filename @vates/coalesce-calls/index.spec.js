'use strict'

/* eslint-env jest */

const { coalesceCalls } = require('./')

const pDefer = () => {
  const r = {}
  r.promise = new Promise((resolve, reject) => {
    r.reject = reject
    r.resolve = resolve
  })
  return r
}

describe('coalesceCalls', () => {
  it('decorates an async function', async () => {
    const fn = coalesceCalls(promise => promise)

    const defer1 = pDefer()
    const promise1 = fn(defer1.promise)
    const defer2 = pDefer()
    const promise2 = fn(defer2.promise)

    defer1.resolve('foo')
    expect(await promise1).toBe('foo')
    expect(await promise2).toBe('foo')

    const defer3 = pDefer()
    const promise3 = fn(defer3.promise)

    defer3.resolve('bar')
    expect(await promise3).toBe('bar')
  })
})
