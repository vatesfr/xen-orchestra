import React, { PureComponent } from 'react'

const {
  create,
  defineProperty,
  defineProperties,
  getOwnPropertyDescriptors = obj => {
    const descriptors = {}
    const { getOwnPropertyDescriptor } = Object
    for (const prop in obj) {
      const descriptor = getOwnPropertyDescriptor(obj, prop)
      if (descriptor !== undefined) {
        descriptors[prop] = descriptor
      }
    }
    return descriptors
  },
  prototype: { hasOwnProperty },
} = Object

const makePropsSpy =
  typeof Proxy !== 'undefined'
    ? (obj, spy) =>
      new Proxy(obj, {
        get: (target, property) => (spy[property] = target[property]),
      })
    : (obj, spy) => {
      const descriptors = {}
      const props = getOwnPropertyDescriptors(obj)
      for (const prop in props) {
        const { configurable, enumerable, get, value } = props[prop]
        descriptors[prop] = {
          configurable,
          enumerable,
          get:
              get !== undefined
                ? () => (spy[prop] = get.call(obj))
                : () => (spy[prop] = value),
        }
      }
      return create(null, descriptors)
    }

// Decorator which provides computed properties for React components.
//
// ```js
// const MyComponent = computed({
//   fullName: ({ firstName, lastName }) => `${lastName}, ${firstName}`
// })(({ fullName }) =>
//   <p>{fullName}</p>
// )
// ```
const computed = computed => Component =>
  class extends PureComponent {
    constructor () {
      super()

      this._computedCache = create(null)
      this._computedDeps = create(null)

      const descriptors = (this._descriptors = {})
      for (const name in computed) {
        if (!hasOwnProperty.call(computed, name)) {
          continue
        }

        const transform = computed[name]
        let running = false
        descriptors[name] = {
          configurable: true,
          enumerable: true,
          get: () => {
            // this is necessary to allow a computed value to depend on
            // itself
            if (running) {
              console.log(name, 'running')
              return this.props[name]
            }

            const cache = this._computedCache
            const deps = this._computedDeps

            const dependencies = deps[name]
            let needsRecompute = dependencies === undefined
            if (!needsRecompute) {
              const { props } = this
              for (const depName in dependencies) {
                const value =
                  depName === name || !(depName in cache)
                    ? props[depName]
                    : cache[depName]
                needsRecompute = value !== dependencies[depName]
                if (needsRecompute) {
                  break
                }
              }
            }

            console.log(name, needsRecompute)

            if (needsRecompute) {
              running = true
              cache[name] = transform(
                makePropsSpy(this._props, (deps[name] = create(null)))
              )
              running = false
            }

            const value = cache[name]
            defineProperty(this._props, name, {
              enumerable: true,
              value,
            })
            return value
          },
        }
      }
    }

    render () {
      this._props = defineProperties({ ...this.props }, this._descriptors)

      return <Component {...this._props} />
    }
  }
export { computed as default }
