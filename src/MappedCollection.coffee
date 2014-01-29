{EventEmitter: $EventEmitter} = require 'events'

#----------------------------------------------------------------------

$_ = require 'underscore'

#=====================================================================

# TODO: move these helpers in a dedicated module.

$done = {}

# Similar to `$_.each()` but can be interrupted by returning the
# special value `done` provided as the forth argument.
$each = (col, iterator, ctx) ->
  # The default context is inherited.
  ctx ?= this

  if (n = col.length)?
    # Array-like object.
    i = 0
    while i < n and (iterator.call ctx, col[i], "#{i}", col, $done) isnt $done
      ++i
  else
    for key of col
      break if (iterator.call ctx, col[key], key, $done) is $done

  # For performance.
  undefined

$makeFunction = (val) -> -> val

# Similar to `$_.map()` for array and `$_.mapValues()` for objects.
#
# Note: can  be interrupted by returning the special value `done`
# provided as the forth argument.
$map = (col, iterator, ctx) ->
  # The default context is inherited.
  ctx ?= this

  if (n = col.length)?
    result = []
    # Array-like object.
    i = 0
    while i < n
      value = iterator.call ctx, col[i], "#{i}", col, $done
      break if value is $done
      result.push value
      ++i
  else
    result = {}
    for key of col
      value = iterator.call ctx, col[key], key, $done
      break if value is $done
      result.push value

  # The new collection is returned.
  result

# Similar to `$map()` but change the current collection.
#
# Note: can  be interrupted by returning the special value `done`
# provided as the forth argument.
$mapInPlace = (col, iterator, ctx) ->
  # The default context is inherited.
  ctx ?= this

  if (n = col.length)?
    # Array-like object.
    i = 0
    while i < n
      value = iterator.call ctx, col[i], "#{i}", col, $done
      break if value is $done
      col[i] = value
      ++i
  else
    for key of col
      value = iterator.call ctx, col[key], key, $done
      break if value is $done
      col[key] = value

  # The collection is returned.
  col

#=====================================================================

class $MappedCollection extends $EventEmitter

  # The dispatch function is called whenever a new item has to be
  # processed and returns the name of the rule to use.
  #
  # To change the way it is dispatched, just override this it.
  dispatch: ->
    (@genval and (@genval.rule ? @genval.type)) ? 'unknown'

  # This function is called when an item has been dispatched to a
  # missing rule.
  #
  # The default behavior is to throw an error but you may instead
  # choose to create a rule:
  #
  #     collection.missingRule = collection.rule
  missingRule: (name) ->
    throw new Error "undefined rule “#{name}”"

  # This function is called when the new generator of an existing item has been
  # matched to a different rule.
  #
  # The default behavior is to throw an error as it usually indicates a bug but
  # you can ignore it.
  ruleConflict: (rule, item) ->
    throw new Error "the item “#{item.key}” was of rule “#{item.rule}” "+
      "but matches to “#{rule}”"

  constructor: ->
    # Items are stored here indexed by key.
    #
    # The prototype of this object is set to `null` to avoid pollution
    # from enumerable properties of `Object.prototype` and the
    # performance hit of  `hasOwnProperty o`.
    @_byKey = Object.create null

    # Hooks are stored here indexed by moment.
    @_hooks = {
      beforeDispatch: []
      beforeUpdate: []
      beforeSave: []
      afterRule: []
    }

    # Rules are stored here indexed by name.
    #
    # The prototype of this object is set to `null` to avoid pollution
    # from enumerable properties of `Object.prototype` and to be able
    # to use the `name of @_rules` syntax.
    @_rules = Object.create null

  # Register a hook to run at a given point.
  #
  # A hook receives as parameter an event object with the following
  # properties:
  # - `preventDefault()`: prevents the next default action from
  #   happening;
  # - `stopPropagation()`: prevents other hooks from being run.
  #
  # Note: if a hook throws an exception, `event.stopPropagation()`
  # then `event.preventDefault()` will be called and the exception
  # will be forwarded.
  #
  # # Item hook
  #
  # Valid items related moments are:
  # - beforeDispatch: even before the item has been dispatched;
  # - beforeUpdate: after the item has been dispatched but before
  #   updating its value.
  # - beforeSave: after the item has been updated.
  #
  # An item hook is run in the context of the current item.
  #
  # # Rule hook
  #
  # Valid rules related moments are:
  # - afterRule: just after a new rule has been defined (even
  #   singleton).
  #
  # An item hook is run in the context of the current rule.
  hook: (name, hook) ->
    # Allows a nicer syntax for CoffeeScript.
    if $_.isObject name
      # Extracts the name and the value from the first property of the
      # object.
      do ->
        object = name
        return for own name, hook of object

    hooks = @_hooks[name]

    @_assert(
      hooks?
      "invalid hook moment “#{name}”"
    )

    hooks.push hook

  # Register a new singleton rule.
  #
  # See the `rule()` method for more information.
  item: (name, definition) ->
    # Creates the corresponding rule.
    rule = @rule name, definition, true

    # Creates the singleton.
    item = {
      rule: rule.name
      key: rule.key() # No context because there is not generator.
      val: undefined
    }
    @_updateItems [item], true

  # Register a new rule.
  #
  # If the definition is a function, it will be run in the context of
  # an item-like object with the following properties:
  # - `key`: the definition for the key of this item;
  # - `val`: the definition for the value of this item.
  #
  # Warning: The definition function is run only once!
  rule: (name, definition, singleton = false) ->
    # Allows a nicer syntax for CoffeeScript.
    if $_.isObject name
      # Extracts the name and the definition from the first property
      # of the object.
      do ->
        object = name
        return for own name, definition of object

    @_assert(
      name not of @_rules
      "the rule “#{name}” is already defined"
    )

    # Extracts the rule definition.
    if $_.isFunction definition
      ctx = {
        name
        key: undefined
        data: undefined
        val: undefined
        singleton
      }
      definition.call ctx
    else
      ctx = {
        name
        key: definition?.key
        data: definition?.data
        val: definition?.val
        singleton
      }

    # Runs the `afterRule` hook and returns if the registration has
    # been prevented.
    return unless @_runHook 'afterRule', ctx

    {key, data, val} = ctx

    # The default key.
    key ?= if singleton then -> name else -> @genkey

    # The default value.
    val ?= -> @genval

    # Makes sure `key` is a function for uniformity.
    key = $makeFunction key unless $_.isFunction key

    # Register the new rule.
    @_rules[name] = {
      name
      key
      data
      val
      singleton
    }

  #--------------------------------

  get: (keys, ignoreMissingItems = false) ->
    if keys is undefined
      items = $_.map @_byKey, (item) -> item.val
    else
      items = @_fetchItems keys, ignoreMissingItems
      $mapInPlace items, (item) -> item.val

      if $_.isString keys then items[0] else items

  getRaw: (keys, ignoreMissingItems = false) ->
    if keys is undefined
      item for _, item of @_byKey
    else
      items = @_fetchItems keys, ignoreMissingItems

      if $_.isString keys then items[0] else items

  remove: (keys, ignoreMissingItems = false) ->
    @_removeItems (@_fetchItems keys, ignoreMissingItems)

  set: (items, {add, update, remove} = {}) ->
    add = true unless add?
    update = true unless update?
    remove = false unless remove?

    itemsToAdd = {}
    itemsToUpdate = {}

    itemsToRemove = {}
    $_.extend itemsToRemove, @_byKey if remove

    $each items, (genval, genkey) =>
      item = {
        rule: undefined
        key: undefined
        data: undefined
        val: undefined
        genkey
        genval
      }

      return unless @_runHook 'beforeDispatch', item

      # Searches for a rule to handle it.
      ruleName = @dispatch.call item
      rule = @_rules[ruleName]

      unless rule?
        @missingRule ruleName

        # If `missingRule()` has not created the rule, just keep this
        # item.
        rule = @_rules[ruleName]
        return unless rule?

      # Checks if this is a singleton.
      @_assert(
        not rule.singleton
        "cannot add items to singleton rule “#{rule.name}”"
      )

      # Computes its key.
      key = rule.key.call item

      @_assert(
        $_.isString key
        "the key “#{key}” is not a string"
      )

      # Updates known values.
      item.rule = rule.name
      item.key = key

      if key of @_byKey
        # Marks this item as not to be removed.
        delete itemsToRemove[key]

        if update
          # Fetches the existing entry.
          prev = @_byKey[key]

          # Checks if there is a conflict in rules.
          @ruleConflict item.rule, prev unless item.rule is prev.rule

          # Gets its previous data/value.
          item.data = prev.data
          item.val = prev.val

          # Registers the item to be updated.
          itemsToUpdate[key] = item

          # Note: an item will be updated only once per `set()` and
          # only the last generator will be used.
      else
        if add

          # Registers the item to be added.
          itemsToAdd[key] = item

    # Adds items.
    @_updateItems itemsToAdd, true

    # Updates items.
    @_updateItems itemsToUpdate

    # Removes any items not seen (iff `remove` is true).
    @_removeItems itemsToRemove

  # Forces items to update their value.
  touch: (keys) ->
    @_updateItems (@_fetchItems keys, true)

  #--------------------------------

  _assert: (cond, message) ->
    throw new Error message unless cond

  # Emits item related event.
  _emitEvent: (event, items) ->
    byRule = Object.create null

    # One per item.
    $each items, (item) =>
      @emit "key=#{item.key}", event, item

      (byRule[item.rule] ?= []).push item

    # One per rule.
    @emit "rule=#{rule}", event, byRule[rule] for rule of byRule

    # One for everything.
    @emit 'any', event, items

  _fetchItems: (keys, ignoreMissingItems = false) ->
    unless $_.isArray keys
      keys = if $_.isObject keys then $_.keys keys else [keys]

    items = []
    for key in keys
      item = @_byKey[key]
      if item?
        items.push item
      else
        @_assert(
          ignoreMissingItems
          "no item with key “#{key}”"
        )
    items

  _removeItems: (items) ->
    return if $_.isEmpty items

    $each items, (item) => delete @_byKey[item.key]

    @_emitEvent 'exit', items


  # Runs hooks for the moment `name` with the given context and
  # returns false if the default action has been prevented.
  _runHook: (name, ctx) ->
    hooks = @_hooks[name]

    # If no hooks, nothing to do.
    return true unless hooks? and (n = hooks.length) isnt 0

    # Flags controlling the run.
    notStopped = true
    actionNotPrevented = true

    # Creates the event object.
    event = {
      stopPropagation: -> notStopped = false

      # TODO: Should `preventDefault()` imply `stopPropagation()`?
      preventDefault: -> actionNotPrevented = false
    }

    i = 0
    while notStopped and i < n
      hooks[i++].call ctx, event

    # TODO: Is exception handling necessary to have the wanted
    # behavior?

    return actionNotPrevented

  _updateItems: (items, areNew) ->
    return if $_.isEmpty items

    # An update is similar to an exit followed by an enter.
    @_emitEvent 'exit', items unless areNew

    $each items, (item) =>
      return unless @_runHook 'beforeUpdate', item

      {rule: ruleName} = item

      # Computes its value.
      do =>
        # Item is not passed directly to function to avoid direct
        # modification.
        #
        # This is not a true security but better than nothing.
        proxy = Object.create item

        updateValue = (parent, prop, def) ->
          if not $_.isObject def
            parent[prop] = def
          else if $_.isFunction def
            parent[prop] = def.call proxy, parent[prop]
          else if $_.isArray def
            i = 0
            n = def.length

            current = parent[prop] ?= new Array n
            while i < n
              updateValue current, i, def[i]
              ++i
          else
            # It's a plain object.
            current = parent[prop] ?= {}
            for i of def
              updateValue current, i, def[i]

        updateValue item, 'data', @_rules[ruleName].data
        updateValue item, 'val', @_rules[ruleName].val

      return unless @_runHook 'beforeSave', item

      # Registers the new item.
      @_byKey[item.key] = item

    @_emitEvent 'enter', items

    # TODO: checks for loops.

#=====================================================================

module.exports = {$MappedCollection}
