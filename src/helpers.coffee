$_ = require 'underscore'

#=====================================================================

$removeValue = (array, value) ->
  index = array.indexOf value
  return false if index is -1
  array.splice index, 1
  true

#---------------------------------------------------------------------

$watch = (collection, {
  key
  keys

  rule
  rules

  val

  if: cond
}, fn) ->
  # The default value is simply the value of the item.
  val ?= -> @val

  process = (event, items) ->
    values = []

    $_.each items, (item) ->
      return unless not cond? or cond.call item

      # Compute the current value.
      value = val.call item

      values.push [event, value]

    # If something has been processed, call `fn`.
    fn values unless $_.isEmpty values

  processOne = (event, item) ->
    process event, [item]

  # Sets up the watch based on the provided criteria.
  #
  # TODO: provides a way to clean this when no longer used.
  (keys ?= []).push key if key?
  (rules ?= []).push rule if rule?
  if not $_.isEmpty keys
    # Matching is done on the keys.

    throw new Error 'cannot use keys and rules' unless $_.isEmpty rules

    $_.each keys, (key) -> collection.on "key=#{key}", processOne
  else if not $_isEmpty rules
    # Matching is done the rules.

    $_.each rules, (rule) -> collection.on "rule=#{rule}", process
  else
    # No matching done.

    collection.on 'any', updateMultiple

#=====================================================================

# Creates a set of value from various items.
$set = (options) ->
  #bind # TODO
  # Contrary to other helpers, the default value is the key.
  options.val ?= -> @key

  # Keys of items using this value.
  users = Object.create null

  # The current set.
  set = []

  $watch this, options, (values) =>
    changed = false

    $_.each values, ([event, value]) ->
      if event is 'enter'
        return unless set.indexOf value is -1
        set.push value
        changed = true
      else
        changed = true if $removeValue set, value

    @touch users if changed

  # This function both allows users to register to this set and gives
  # them the current value.
  ->
    users[@key] = true
    set

#---------------------------------------------------------------------

$sum = (options) ->
  # Keys of items using this value.
  users = Object.create null

  # The current sum.
  if options.init
    sum = options.init
    delete options.init
  else
    sum = 0

  $watch this, options, (values) =>
    prev = sum

    $_.each values, ([event, value]) ->
      sum += if event is 'enter' then value else -value

    @touch users if sum isnt prev

  # This function both allows users to register to this sum and gives
  # them the current value.
  ->
    users[@key] = true
    sum

#---------------------------------------------------------------------

# Uses a value from another item.
#
# Important note: This helper is badly specified when binding to
# multiple items.
$val = (options) ->
  # Keys of items using this value.
  users = Object.create null

  # The default value.
  def = options.default
  delete options.default

  # Should the last value be kept instead of returning to the default
  # value when no items are available!
  keepLast = !!options.keepLast
  delete options.keepLast

  # The current value.
  value = def

  $watch this, options, (values) =>
    prev = value

    for [event, value] in values
      break if event is 'enter'

      value = def unless keepLast

    @touch users if value isnt prev

  ->
    users[@key] = true
    value

#=====================================================================

module.exports = {
  $set
  $sum
  $val
}
