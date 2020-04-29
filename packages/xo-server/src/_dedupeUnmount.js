import assert from 'assert'

import ensureArray from './_ensureArray'
import MultiKeyMap from './_MultiKeyMap'
import { coalesceCalls } from './_coalesceCalls'

function State() {
  this.i = 0
  this.value = undefined
}

export const dedupeUnmount = (fn, keyFn) => {
  const states = new MultiKeyMap()
  return coalesceCalls(async function() {
    const keys = ensureArray(keyFn.apply(this, arguments))
    let state = states.get(keys)
    if (state === undefined) {
      state = new State()
      states.set(keys, state)
      const value = await fn.apply(this, arguments)
      state.value = {
        __proto__: value,
        async unmount() {
          assert(state.i > 0)
          if (--state.i === 0) {
            states.delete(keys)
            await value.unmount()
          }
        },
      }
    }
    ++state.i
    return state.value
  })
}
