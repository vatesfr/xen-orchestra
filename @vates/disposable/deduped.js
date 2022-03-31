'use strict'

const ensureArray = require('ensure-array')
const { MultiKeyMap } = require('@vates/multi-key-map')

function State(factory) {
  this.factory = factory
  this.users = 0
}

const call = fn => fn()

exports.deduped = (factory, keyFn = (...args) => args) =>
  (function () {
    const states = new MultiKeyMap()
    return function () {
      const keys = ensureArray(keyFn.apply(this, arguments))
      let state = states.get(keys)
      if (state === undefined) {
        const result = factory.apply(this, arguments)

        const createFactory = disposable => {
          const wrapper = {
            dispose() {
              if (--state.users === 0) {
                states.delete(keys)
                return disposable.dispose()
              }
            },
            value: disposable.value,
          }

          return () => {
            return wrapper
          }
        }

        if (typeof result.then !== 'function') {
          state = new State(createFactory(result))
        } else {
          result.catch(() => {
            states.delete(keys)
          })
          const pFactory = result.then(createFactory)
          state = new State(() => pFactory.then(call))
        }

        states.set(keys, state)
      }

      ++state.users
      return state.factory()
    }
  })()
