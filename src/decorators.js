// Debounce decorator for methods.
//
// See: https://github.com/wycats/javascript-decorators
export const debounce = (duration) => (target, name, descriptor) => {
  const {value: fn} = descriptor

  // This symbol is used to store the related data directly on the
  // current object.
  const s = Symbol()

  function debounced () {
    let data = this[s] || (this[s] = {
      lastCall: 0,
      wrapper: null
    })

    const now = Date.now()
    if (now > data.lastCall + duration) {
      data.lastCall = now
      try {
        const result = fn.apply(this, arguments)
        data.wrapper = () => result
      } catch (error) {
        data.wrapper = () => { throw error }
      }
    }
    return data.wrapper()
  }
  debounced.reset = (obj) => { delete obj[s] }

  descriptor.value = debounced
  return descriptor
}
