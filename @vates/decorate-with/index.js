'use strict'

exports.decorateWith = function decorateWith(fn, ...args) {
  return (target, name, descriptor) => ({
    ...descriptor,
    value: fn(descriptor.value, ...args),
  })
}

const { getOwnPropertyDescriptor, defineProperty } = Object

function applyDecorator(decorator, value) {
  return typeof decorator === 'function' ? decorator(value) : decorator[0](value, ...decorator.slice(1))
}

exports.decorateClass = exports.decorateMethodsWith = function decorateClass(klass, map) {
  const { prototype } = klass
  for (const name of Object.keys(map)) {
    const decorator = map[name]
    const descriptor = getOwnPropertyDescriptor(prototype, name)
    if (typeof decorator === 'function' || Array.isArray(decorator)) {
      descriptor.value = applyDecorator(decorator, descriptor.value)
    } else {
      const { get, set } = decorator
      if (get !== undefined) {
        descriptor.get = applyDecorator(get, descriptor.get)
      }
      if (set !== undefined) {
        descriptor.set = applyDecorator(set, descriptor.set)
      }
    }

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
