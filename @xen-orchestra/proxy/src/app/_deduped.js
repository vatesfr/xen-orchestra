import Disposable from 'promise-toolbox/Disposable'
import ensureArray from 'ensure-array'
import { MultiKeyMap } from '@vates/multi-key-map'

function State(pGetNewDisposable) {
  this.pGetNewDisposable = pGetNewDisposable
  this.users = 0
}

const call = fn => fn()

export const deduped = (factory, keyFn = (...args) => args) =>
  (function () {
    const states = new MultiKeyMap()
    return function () {
      const keys = ensureArray(keyFn.apply(this, arguments))
      let state = states.get(keys)
      if (state === undefined) {
        const pDisposable = factory.apply(this, arguments)
        pDisposable.catch(() => {
          states.delete(keys)
        })

        state = new State(
          pDisposable.then(({ value, dispose }) => {
            const disposeWrapper = () => {
              if (--state.users === 0) {
                states.delete(keys)
                return dispose()
              }
            }
            return () => new Disposable(value, disposeWrapper)
          })
        )
        states.set(keys, state)
      }

      ++state.users
      return state.pGetNewDisposable.then(call)
    }
  })()
