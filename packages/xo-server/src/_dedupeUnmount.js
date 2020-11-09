import assert from 'assert'
import { MultiKeyMap } from '@vates/multi-key-map'

import ensureArray from './_ensureArray'

function State() {
  this.i = 0
  this.value = undefined
}

export const dedupeUnmount = (fn, keyFn) => {
  const states = new MultiKeyMap()

  return function () {
    const keys = ensureArray(keyFn.apply(this, arguments))
    let state = states.get(keys)
    if (state === undefined) {
      state = new State()
      states.set(keys, state)

      const mount = async () => {
        try {
          const value = await fn.apply(this, arguments)
          return {
            __proto__: value,
            async unmount() {
              assert(state.i > 0)
              if (--state.i === 0) {
                states.delete(keys)
                await value.unmount()
              }
            },
          }
        } catch (error) {
          states.delete(keys)
          throw error
        }
      }

      state.value = mount()
    }
    ++state.i
    return state.value
  }
}
