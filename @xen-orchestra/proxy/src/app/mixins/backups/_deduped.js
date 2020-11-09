import ensureArray from 'ensure-array'
import Resource from 'promise-toolbox/_Resource'
import { MultiKeyMap } from '@vates/multi-key-map'

export const debounceResource = (resource, delay) => {
  const expires = Date.now() + delay
  return new Resource(resource.p, value => {
    const delay = expires - Date.now()
    if (delay <= 0) {
      return resource.d(value)
    }

    setTimeout(() => resource.d(value), delay)
  })
}

function State(resource) {
  this.users = 0
  this.resource = resource
}

export const deduped = (factory, keyFn = (...args) => args, delay = 0) =>
  (function () {
    const delayFn = typeof delay === 'number' ? () => delay : delay

    const states = new MultiKeyMap()
    return function () {
      const keys = ensureArray(keyFn.apply(this, arguments))
      let state = states.get(keys)
      if (state === undefined) {
        state = new State(factory.apply(this, arguments))
        states.set(keys, state)
      }

      ++state.users
      return debounceResource(
        new Resource(state.resource.p, value => {
          if (--state.users === 0) {
            states.delete(keys)
            return state.resource.d(value)
          }
        }),
        delayFn.apply(this, arguments)
      )
    }
  })()
