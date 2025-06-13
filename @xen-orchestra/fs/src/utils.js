import { TimeoutError } from 'promise-toolbox'

export function withTimeout(fn, timeout) {
  return function (...args) {
    let timeoutHandle
    const timeoutPromise = new Promise((_resolve, reject) => {
      timeoutHandle = setTimeout(() => reject(new TimeoutError()), timeout)
    })
    return Promise.race([Promise.resolve().then(() => fn.apply(this, args)), timeoutPromise])
      .then(result => {
        clearTimeout(timeoutHandle)
        return result
      })
      .catch(err => {
        clearTimeout(timeoutHandle)
        throw err
      })
  }
}
