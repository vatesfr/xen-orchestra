$_ = require 'underscore'

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
# “$MappedCollection2.set()” which is inefficient: there should be
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
}, fn) ->
  val = if val is undefined
    # The default value is simply the value of the item.
    -> @val
  else
    $asFunction val

  # Method allowing the cleanup when the helper is no longer used.
  #cleanUp = -> # TODO: noop for now.

  # Keys of items using the current helper.
  consumers = Object.create null

  # Current values.
  values = Object.create null
  values.common = init

  isProcessing = false
  process = (event, items) ->

    # Values are grouped by namespace.
    valuesByNamespace = Object.create null

    $each items, (item) ->
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

      (valuesByNamespace[namespace] ?= {})[item.key] = value

    # Stops here if no values were computed.
    return if do ->
      return false for _ of valuesByNamespace
      true

    throw new Error 'loop detected' if isProcessing
    isProcessing = true

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

    isProcessing = false

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

  # Returns the generator.
  ->
    {key} = this

    # Register this item has a consumer.
    consumers[@key] = true

    # Returns the value for this item if any or the common value.
    namespace = "$#{key}"
    if namespace of values
      values[namespace]
    else
      values.common

#=====================================================================

$map = (options) ->
  options.init = []

  $watch this, options, (entered, exited) ->
    $each entered, (value, key) => @value[key] = value
    $each exited, (value, key) => delete @value[key]

#---------------------------------------------------------------------

# Creates a set of value from various items.
$set = (options) ->
  # Contrary to other helpers, the default value is the key.
  options.val ?= -> @key

  options.init = []

  $watch this, options, (entered, exited) ->
    changed = false

    $each entered, (value) =>
      if @value.indexOf value is -1
        @value.push value
        changed = true

    $each exited, (value) =>
      changed = true if $removeValue @value, value

    changed

#---------------------------------------------------------------------

$sum = (options) ->
  init = options.init ?= 0

  add = (a, b) ->
    if $_.isArray a
      n = a.length
      throw new Error 'invalid sum' unless $_.isArray b and b.length is n
      i = 0
      while i < n
        a[i] = add a[i], b[i]
        ++i
    else if $_.isObject a
      throw new Error 'invalid sum' unless $_.isObject b
      for key of a
        a[key] = add a[key], b[key]
    else
      a += b
    a
  sub = (a, b) ->
    if $_.isArray a
      n = a.length
      throw new Error 'invalid sum' unless $_.isArray b and b.length is n
      i = 0
      while i < n
        a[i] = sub a[i], b[i]
        ++i
    else if $_.isObject a
      throw new Error 'invalid sum' unless $_.isObject b
      for key of a
        a[key] = sub a[key], b[key]
    else
      a -= b
    a

  $watch this, options, (entered, exited) ->
    prev = @value

    $each entered, (value) => @value = add @value, value
    $each exited, (value) => @value = sub @value, value

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
  $set
  $sum
  $val
}
