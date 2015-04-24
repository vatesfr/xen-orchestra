// FIXME: This file name should reflect what's inside!

// ===================================================================

import $clone from 'lodash.clone'
import $forEach from 'lodash.foreach'
import $isArray from 'lodash.isarray'
import $isEmpty from 'lodash.isempty'
import $isFunction from 'lodash.isfunction'

// ===================================================================

const $asArray = (val) => $isArray(val) ? val : [val]
const $asFunction = (val) => $isFunction(val) ? val : () => val

const $first = (collection, defaultValue) => {
  const {length} = collection
  if (length == null) {
    for (let key in collection) {
      return collection[key]
    }
  } else if (length) {
    return collection[0]
  }

  // Nothing was found, returns the `def` value.
  return defaultValue
}

const $removeValue = (array, value) => {
  const index = array.indexOf(value)
  if (index === -1) {
    return false
  }

  array.splice(index, 1)
  return true
}

// -------------------------------------------------------------------

// TODO: currently the watch can be updated multiple times per
// “$MappedCollection.set()” which is inefficient: it should be
// possible to address that.

const $watch = (collection, {
  // Key(s) of the “remote” objects watched.
  //
  // If it is a function, it is evaluated in the scope of the “current”
  // object. (TODO)
  //
  // Default: undefined
  keys,

  // Alias for `keys`.
  key,

  // Rule(s) of the “remote” objects watched.
  //
  // If it is a function, it is evaluated in the scope of the “current”
  // object. (TODO)
  //
  // Note: `key`/`keys` and `rule`/`rules` cannot be used both.
  //
  // Default: undefined
  rules,

  // Alias for `rules`.
  rule,

  // Value to add to the set.
  //
  // If it is a function, it is evaluated in the scope of the “remote”
  // object.
  //
  // Default: -> @val
  val,

  // Predicates the “remote” object must fulfill to be used.
  //
  // Default: -> true
  if: cond,

  // Function evaluated in the scope of the “remote” object which
  // returns the key of the object to update (usually the current one).
  //
  // TODO: Does it make sense to return an array?
  //
  // Default: undefined
  bind,

  // Initial value.
  init,

  // Function called when a loop is detected.
  //
  // Usually it is used to either throw an exception or do nothing to
  // stop the loop.
  //
  // Note: The function may also returns `true` to force the processing
  // to continue.
  loopDetected = () => { throw new Error('loop detected') }
}, fn) => {
  val = val == null ?
    // The default value is simply the value of the item.
    function () { return this.val } :
    $asFunction(val)

  // Method allowing the cleanup when the helper is no longer used.
  // cleanUp = -> // TODO: noop for now.

  // Keys of items using the current helper.
  const consumers = Object.create(null)

  // Current values.
  const values = Object.create(null)
  values.common = init

  // The number of nested processing for this watcher is counted to
  // avoid an infinite loop.
  let loops = 0

  let updating = false

  const process = (event, items) => {
    if (updating) return

    // Values are grouped by namespace.
    const valuesByNamespace = Object.create(null)

    $forEach(items, (item) => {
      if (cond && !cond.call(item)) return

      const namespace = (function () {
        if (bind) {
          const key = bind.call(item)

          return key && `$${key}`
        } else {
          return 'common'
        }
      })()

      // If not namespace, ignore this item.
      if (!namespace) return

      (
        valuesByNamespace[namespace] ||
        (valuesByNamespace[namespace] = [])
      ).push(val.call(item))
    })

    // Stops here if no values were computed.
    if ($isEmpty(valuesByNamespace)) return

    if (loops && loopDetected(loops) !== true) return
    const previousLoops = loops++

    // For each namespace.
    $forEach(valuesByNamespace, (values_, namespace) => {
      // Updates the value.
      const value = values[namespace]

      const ctx = {
        // TODO: test the $clone
        value: value == null ? $clone(init) : value
      }
      const changed = event === 'enter' ?
        fn.call(ctx, values_, {}) :
        fn.call(ctx, {}, values_)

      // Notifies watchers unless it is known the value has not
      // changed.
      if (changed !== false) {
        values[namespace] = ctx.value
        updating = true
        if (namespace === 'common') {
          collection.touch(consumers)
        } else {
          collection.touch(namespace.substr(1))
        }
        updating = false
      }
    })

    loops = previousLoops
  }

  const processOne = (event, item) => process(event, [item])

  // Sets up the watch based on the provided criteria.
  //
  // TODO: provides a way to clean this when no longer used.
  keys = $asArray(keys || key || [])
  rules = $asArray(rules || rule || [])
  if (!$isEmpty(keys)) {
    // Matching is done on the keys.

    if (!$isEmpty(rules)) {
      throw new Error('cannot use both keys and rules')
    }

    $forEach(keys, key => {
      collection.on(`key=${key}`, processOne)
    })

    // Handles existing items.
    process('enter', collection.getRaw(keys, true))
  } else if (!$isEmpty(rules)) {
    // Matching is done the rules.

    $forEach(rules, rule => {
      collection.on(`rule=${rule}`, process)
    })

    // TODO: Inefficient, is there another way?
    rules = (function (rules) { // Minor optimization.
      const tmp = Object.create(null)
      for (let rule of rules) {
        tmp[rule] = true
      }
      return tmp
    })(rules)
    $forEach(collection.getRaw(), item => {
      if (rules[item.rule]) {
        processOne('enter', item)
      }
    })
  } else {
    // No matching done.

    collection.on('any', process)

    // Handles existing items.
    process('enter', collection.getRaw())
  }

  // Creates the generator: the function which items will used to
  // register to this watcher and to get the current value.
  const generator = function () {
    const {key} = this

    // Register this item has a consumer.
    consumers[key] = true

    // Returns the value for this item if any or the common value.
    const namespace = `$${key}`
    return (namespace in values) ?
      values[namespace] :
      values.common
  }

  // Creates a helper to unregister an item from this watcher.
  generator.unregister = function () {
    const {key} = this
    delete consumers[key]
    delete values[`$${key}`]
  }

  // Creates a helper to get the value without using an item.
  generator.raw = (key) => values[key != null ? `$${key}` : 'common']

  // Returns the generator.
  return generator
}

// ===================================================================

export const $map = function (options) {
  options.init = Object.create(null)

  return $watch(this, options, function (entered, exited) {
    let changed = false

    $forEach(entered, ([key, value]) => {
      if (this.value[key] !== value) {
        this.value[key] = value
        changed = true
      }
    })
    $forEach(exited, ([key, value]) => {
      if (key in this.value) {
        delete this.value[key]
        changed = true
      }
    })

    return changed
  })
}

// -------------------------------------------------------------------

// Creates a set of value from various items.
export const $set = function (options) {
  // Contrary to other helpers, the default value is the key.
  if (!options.val) {
    options.val = function () { return this.key }
  }

  options.init = []

  return $watch(this, options, function (entered, exited) {
    let changed = false

    $forEach(entered, (value) => {
      if (this.value.indexOf(value) === -1) {
        this.value.push(value)
        changed = true
      }
    })

    $forEach(exited, (value) => {
      if ($removeValue(this.value, value)) {
        changed = true
      }
    })

    return changed
  })
}

// -------------------------------------------------------------------

export const $sum = function (options) {
  if (!options.init) {
    options.init = 0
  }

  return $watch(this, options, function (entered, exited) {
    const prev = this.value

    $forEach(entered, (value) => { this.value += value })
    $forEach(exited, (value) => { this.value -= value })

    return this.value !== prev
  })
}

// -------------------------------------------------------------------

// Uses a value from another item.
//
// Important note: Behavior is not specified when binding to multiple
// items.
export const $val = function (options) {
  // The default value.
  const def = options.default
  delete options.default

  if (!options.init) {
    options.init = def
  }

  // Should the last value be kept instead of returning to the default
  // value when no items are available!
  const keepLast = !!options.keepLast
  delete options.keepLast

  return $watch(this, options, function (entered, exited) {
    const prev = this.value

    this.value = $first(entered, keepLast ? this.value : def)

    return this.value !== prev
  })
}
