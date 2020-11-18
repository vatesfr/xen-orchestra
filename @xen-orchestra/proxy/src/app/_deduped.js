import ensureArray from 'ensure-array'
import Resource from 'promise-toolbox/_Resource'
import { MultiKeyMap } from '@vates/multi-key-map'

function State(resource) {
  this.users = 0
  this.resource = resource
}

export const deduped = (factory, keyFn = (...args) => args) =>
  (function () {
    const states = new MultiKeyMap()
    return function () {
      const keys = ensureArray(keyFn.apply(this, arguments))
      let state = states.get(keys)
      if (state === undefined) {
        state = new State(factory.apply(this, arguments))
        states.set(keys, state)
      }

      ++state.users
      return new Resource(state.resource.p, value => {
        if (--state.users === 0) {
          states.delete(keys)
          return state.resource.d(value)
        }
      })
    }
  })()
