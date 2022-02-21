exports.decorateWith = function decorateWith(fn, ...args) {
  return (target, name, descriptor) => ({
    ...descriptor,
    value: fn(descriptor.value, ...args),
  })
}

const { getOwnPropertyDescriptor, defineProperty } = Object

exports.decorateMethodsWith = function decorateMethodsWith(klass, map) {
  const { prototype } = klass
  for (const name of Object.keys(map)) {
    const descriptor = getOwnPropertyDescriptor(prototype, name)
    const { value } = descriptor

    const decorator = map[name]
    descriptor.value = typeof decorator === 'function' ? decorator(value) : decorator[0](value, ...decorator.slice(1))
    defineProperty(prototype, name, descriptor)
  }
  return klass
}

exports.perInstance = function perInstance(fn, decorator, ...args) {
  const map = new WeakMap()
  return function () {
    let decorated = map.get(this)
    if (decorated === undefined) {
      decorated = decorator(fn, ...args)
      map.set(this, decorated)
    }
    return decorated.apply(this, arguments)
  }
}
