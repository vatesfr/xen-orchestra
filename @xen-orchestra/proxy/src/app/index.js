import camelCase from 'lodash/camelCase'

import mixins from './mixins'
import { debounceResource } from './_debounceResource'

const { defineProperties, defineProperty, keys } = Object
const noop = Function.prototype

const MIXIN_CYCLIC_DESCRIPTOR = {
  configurable: true,
  get() {
    throw new Error('cyclic dependency')
  },
}

export default class App {
  constructor(opts) {
    // add lazy property for each of the mixin, this allows mixins to depend on
    // one another without any special ordering
    const descriptors = {}
    keys(mixins).forEach(name => {
      const Mixin = mixins[name]
      name = camelCase(name)

      descriptors[name] = {
        configurable: true,
        get: () => {
          defineProperty(this, name, MIXIN_CYCLIC_DESCRIPTOR)
          const instance = new Mixin(this, opts)
          defineProperty(this, name, {
            value: instance,
          })
          return instance
        },
      }
    })
    defineProperties(this, descriptors)

    // access all mixin properties to trigger their creation
    keys(descriptors).forEach(name => {
      noop(this[name])
    })

    // dispose all created resources on stop
    this.hooks.once('stop', () => {
      debounceResource.flushAll().catch(() => {})
    })
  }

  debounceResource(pDisposable) {
    return debounceResource(pDisposable, this.config.getDuration('resourceDebounce') ?? 0)
  }
}
