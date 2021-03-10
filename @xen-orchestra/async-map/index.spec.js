/* eslint-env jest */

const { asyncMapSettled } = require('./')

const noop = Function.prototype

describe('asyncMapSettled', () => {
  it('works', async () => {
    const values = [Math.random(), Math.random()]
    const spy = jest.fn(async v => v * 2)
    const iterable = new Set(values)

    // returns an array containing the result of each calls
    expect(await asyncMapSettled(iterable, spy)).toEqual(values.map(value => value * 2))

    for (let i = 0, n = values.length; i < n; ++i) {
      // each call receive the current item as sole argument
      expect(spy.mock.calls[i]).toEqual([values[i]])

      // each call as this bind to the iterable
      expect(spy.mock.instances[i]).toBe(iterable)
    }
  })

  it('can use a specified thisArg', () => {
    const thisArg = {}
    const spy = jest.fn()
    asyncMapSettled(['foo'], spy, thisArg)
    expect(spy.mock.instances[0]).toBe(thisArg)
  })

  it('rejects only when all calls as resolved', async () => {
    const defers = []
    const promise = asyncMapSettled([1, 2], () => {
      let resolve, reject
      // eslint-disable-next-line promise/param-names
      const promise = new Promise((_resolve, _reject) => {
        resolve = _resolve
        reject = _reject
      })
      defers.push({ promise, resolve, reject })
      return promise
    })

    let hasSettled = false
    promise.catch(noop).then(() => {
      hasSettled = true
    })

    const error = new Error()
    defers[0].reject(error)

    // wait for all microtasks to settle
    await new Promise(resolve => setImmediate(resolve))

    expect(hasSettled).toBe(false)

    defers[1].resolve()

    // wait for all microtasks to settle
    await new Promise(resolve => setImmediate(resolve))

    expect(hasSettled).toBe(true)
    await expect(promise).rejects.toBe(error)
  })

  it('issues when latest promise rejects', async () => {
    const error = new Error()
    await expect(asyncMapSettled([1], () => Promise.reject(error))).rejects.toBe(error)
  })
})
