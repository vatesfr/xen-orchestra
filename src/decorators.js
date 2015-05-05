// Debounce decorator for methods.
//
// See: https://github.com/wycats/javascript-decorators
export const debounce = (duration) => (target, name, descriptor) => {
  const {value: fn} = descriptor

  let wrapper
  let lastCall = 0
  function debounced () {
    const now = Date.now()
    if (now > lastCall + duration) {
      lastCall = now
      try {
        const result = fn.apply(this, arguments)
        wrapper = () => result
      } catch (error) {
        wrapper = () => { throw error }
      }
    }
    return wrapper()
  }
  debounced.reset = () => { lastCall = 0 }

  descriptor.value = debounced
  return descriptor
}
