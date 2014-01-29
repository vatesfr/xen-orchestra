$_ = require 'underscore'

# FIXME: This file name should reflect what's inside!

#=====================================================================

$asArray = (val) -> if $_.isArray val then val else [val]
$asFunction = (val) -> if $_.isFunction val then val else -> val

$each = $_.each

$first = (collection, def) ->
  if (n = collection.length)?
    return collection[0] unless n is 0
  else
    return value for own _, value of collection

  # Nothing was found, returns the `def` value.
  def

$removeValue = (array, value) ->
  index = array.indexOf value
  return false if index is -1
  array.splice index, 1
  true

#---------------------------------------------------------------------

# TODO: currently the watch can be updated multiple times per
# “$MappedCollection.set()” which is inefficient: it should be
# possible to address that.

$watch = (collection, {
  # Key(s) of the “remote” objects watched.
  #
  # If it is a function, it is evaluated in the scope of the “current”
  # object. (TODO)
  #
  # Default: undefined
  keys

  # Alias for `keys`.
  key

  # Rule(s) of the “remote” objects watched.
  #
  # If it is a function, it is evaluated in the scope of the “current”
  # object. (TODO)
  #
  # Note: `key`/`keys` and `rule`/`rules` cannot be used both.
  #
  # Default: undefined
  rules

  # Alias for `rules`.
  rule

  # Value to add to the set.
  #
  # If it is a function, it is evaluated in the scope of the “remote”
  # object.
  #
  # Default: -> @val
  val

  # Predicates the “remote” object must fulfill to be used.
  #
  # Default: -> true
  if: cond

  # Function evaluated in the scope of the “remote” object which
  # returns the key of the object to update (usually the current one).
  #
  # TODO: Does it make sense to return an array?
  #
  # Default: undefined
  bind

  # Initial value.
  init

  # Function called when a loop is detected.
  #
  # Usually it is used to either throw an exception or do nothing to
  # stop the loop.
  #
  # Note: The function may also returns `true` to force the processing
  # to continue.
  #
  # Default: (number_of_loops) -> throw new Error 'loop detected'
  loopDetected
}, fn) ->
  val = if val is undefined
    # The default value is simply the value of the item.
    -> @val
  else
    $asFunction val

  loopDetected ?= -> throw new Error 'loop detected'

  # Method allowing the cleanup when the helper is no longer used.
  #cleanUp = -> # TODO: noop for now.

  # Keys of items using the current helper.
  consumers = Object.create null

  # Current values.
  values = Object.create null
  values.common = init

  # The number of nested processing for this watcher is counted to
  # avoid an infinite loop.
  loops = 0

  process = (event, items) ->

    # Values are grouped by namespace.
    valuesByNamespace = Object.create null

    $each items, (item, key) -> # `key` is a local variable.
      return unless not cond? or cond.call item

      if bind?
        key = bind.call item

        # If bind did not return a key, ignores this value.
        return unless key?

        namespace = "$#{key}"
      else
        namespace = 'common'

      # Computes the current value.
      value = val.call item

      (valuesByNamespace[namespace] ?= []).push value

    # Stops here if no values were computed.
    return if do ->
      return false for _ of valuesByNamespace
      true

    if loops
      return unless (loopDetected loops) is true
    previousLoops = loops++

    # For each namespace.
    for namespace, values_ of valuesByNamespace

      # Updates the value.
      value = values[namespace]
      ctx = {
        # TODO: test the $_.clone
        value: if value is undefined then $_.clone init else value
      }
      changed = if event is 'enter'
        fn.call ctx, values_, {}
      else
        fn.call ctx, {}, values_

      # Notifies watchers unless it is known the value has not
      # changed.
      unless changed is false
        values[namespace] = ctx.value
        if namespace is 'common'
          collection.touch consumers
        else
          collection.touch (namespace.substr 1)

    loops = previousLoops

  processOne = (event, item) ->
    process event, [item]

  # Sets up the watch based on the provided criteria.
  #
  # TODO: provides a way to clean this when no longer used.
  keys = $asArray (keys ? key ? [])
  rules = $asArray (rules ? rule ? [])
  if not $_.isEmpty keys
    # Matching is done on the keys.

    throw new Error 'cannot use keys and rules' unless $_.isEmpty rules

    $each keys, (key) -> collection.on "key=#{key}", processOne

    # Handles existing items.
    process 'enter', collection.getRaw keys
  else if not $_.isEmpty rules
    # Matching is done the rules.

    $each rules, (rule) -> collection.on "rule=#{rule}", process

    # TODO: Inefficient, is there another way?
    rules = do -> # Minor optimization.
      tmp = Object.create null
      tmp[rule] = true for rule in rules
      tmp
    $each collection.getRaw(), (item) ->
      processOne 'enter', item if item.rule of rules
  else
    # No matching done.

    collection.on 'any', process

    # Handles existing items.
    process 'enter', collection.getRaw()

  # Creates the generator: the function which items will used to
  # register to this watcher and to get the current value.
  generator = do (key) -> # Declare a local variable.
    ->
      {key} = this

      # Register this item has a consumer.
      consumers[key] = true

      # Returns the value for this item if any or the common value.
      namespace = "$#{key}"
      if namespace of values
        values[namespace]
      else
        values.common

  # Creates a helper to unregister an item from this watcher.
  generator.unregister = do (key) -> # Declare a local variable.
    ->
      {key} = this
      delete consumers[key]
      delete values["$#{key}"]

  # Creates a helper to get the value without using an item.
  generator.raw = (key) ->
    values[if key? then "$#{key}" else 'common']

  # Returns the generator.
  generator

#=====================================================================

$map = (options) ->
  options.init = Object.create null

  $watch this, options, (entered, exited) ->
    changed = false

    $each entered, ([key, value]) =>
      unless @value[key] is value
        @value[key] = value
        changed = true
    $each exited, ([key, value]) =>
      if key of @value
        delete @value[key]
        changed = true

    changed

#---------------------------------------------------------------------

# Creates a set of value from various items.
$set = (options) ->
  # Contrary to other helpers, the default value is the key.
  options.val ?= -> @key

  options.init = []

  $watch this, options, (entered, exited) ->
    changed = false

    $each entered, (value) =>
      if (@value.indexOf value) is -1
        @value.push value
        changed = true

    $each exited, (value) =>
      changed = true if $removeValue @value, value

    changed

#---------------------------------------------------------------------

$sum = (options) ->
  options.init ?= 0

  $watch this, options, (entered, exited) ->
    prev = @value

    $each entered, (value) => @value += value
    $each exited, (value) => @value -= value

    @value isnt prev

#---------------------------------------------------------------------

# Uses a value from another item.
#
# Important note: Behavior is not specified when binding to multiple
# items.
$val = (options) ->
  # The default value.
  def = options.default
  delete options.default

  options.init ?= def

  # Should the last value be kept instead of returning to the default
  # value when no items are available!
  keepLast = !!options.keepLast
  delete options.keepLast

  $watch this, options, (entered, exited) ->
    prev = @value

    @value = $first entered, (if keepLast then @value else def)

    @value isnt prev

#=====================================================================

module.exports = {
  $map
  $set
  $sum
  $val
}
