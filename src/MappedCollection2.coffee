{EventEmitter: $EventEmitter} = require 'events'

#----------------------------------------------------------------------

$_ = require 'underscore'

#=====================================================================

makeFunction = (val) -> -> val

#=====================================================================

class $MappedCollection2 extends $EventEmitter

  constructor: ->
    # Items are stored here indexed by key.
    #
    # The prototype of this object is set to `null` to avoid pollution
    # from enumerable properties of `Object.prototype` and the
    # performance hit of  `hasOwnProperty(o)`.
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
    # to use the `name in @_rules` syntax.
    @_rules = Object.create null

  # Register a dispatch function.
  #
  # The dispatch function is called whenever a new item has to be
  # processed and returns the name of the rule to use.
  dispatch: (fn) ->
    @_dispatch = fn

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
    @_updateItem rule, item

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
      name not in @_rules
      "the rule “#{name}” is already defined"
    )

    # Extracts the rule definition.
    if $_.isFunction definition
      ctx = {
        rule: name
        key: undefined
        val: undefined
        singleton
      }
      definition.call ctx
    else
      ctx = {
        key: definition.key
        val: definition.val
        singleton
      }

    # Runs the `afterRule` hook and returns if the registration has
    # been prevented.
    return unless @_runHook 'afterRule', ctx

    {key, val} = ctx

    # The default key for a singleton is the name of the rule.
    key ?= -> name if singleton

    # Makes sure `key` is a function for uniformity.
    key = makeFunction key unless $_.isFunction key

    # Register the new rule.
    @_rules[name] = {
      name
      key
      val
      singleton
    }

  #--------------------------------

  # Returns the value of the item which has a given key.
  get: (key) -> @_byKey[key]?.val

  getAll: ->
    items = {}

    items[key] = val for key, {val} of @_byKey

    items

  set: (items, {add, update, remove} = {}) ->
    add = true if add is undefined
    update = true if update is undefined
    remove = false if remove is undefined

    itemsToRemove = {}
    $_.extend itemsToRemove, @_byKey if remove

    $_.each items, (genval, genkey) =>
      item = {
        rule: undefined
        key: undefined
        val: undefined
        genkey
        genval
      }

      # Searches for a rule to handle it.
      ruleName = @_dispatch.call item
      rule = @_rules[ruleName]
      @_assert(
        rule?
        "undefined rule “#{ruleName}”"
      )

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

      if key in @_byKey
        # Marks this item as not to be removed.
        delete itemsToRemove[key]

        if update
          # Fetches the existing entry.
          item = @_byKey[key]

          # Checks if there is a conflict in rules.
          @_assert(
            item.rule is rule.name
            "the key “#{key}” cannot be of rule “#{rule.name}”, "
            "already used by “#{item.rule}”"
          )

          # Updates its generator values.
          item.genkey = genkey
          item.genval = genval

          # Updates the item.
          @_updateItem rule, item
      else
        if add
          # Updates known values.
          item.rule = rule.name
          item.key = key

          # Updates the item.
          @_updateItem rule, item

    # Removes any items not seen (iff `remove` is true).
    @_removeItem item for _, item of itemsToRemove

  # Forces an item to update its value.
  touch: (key) ->
    item = @_byKey[key]

    @_assert(
      item?
      "no item with key “#{key}”"
    )

    @_updateItem @_rules[item.rule], item

  #--------------------------------

  _assert: (cond, message) ->
    throw new Error message unless cond

  # Default function used for dispatching.
  _dispatch: ->
    @genval.rule ? @genval.type ? 'unknown'

  # Runs hooks for the moment `name` with the given context and
  # returns false if the default action has been prevented.
  _runHook: (name, ctx) ->
    hooks = @_hooks[name]

    # If no hooks, nothing to do.
    return unless hooks? and (n = hooks.length) isnt 0

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
      hook.call ctx, event
      ++i

    # TODO: Is exception handling necessary to have the wanted
    # behavior?

    return actionNotPrevented

  _updateItem: (rule, item) ->
    return unless @_runHook 'beforeUpdate', item

    # Computes its value.
    do ->
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

      updateValue item, 'val', rule.val

    return unless @_runHook 'beforeSave', item

    # Registers the new item.
    @_byKey[item.key] = item

    # Emits events.
    @emit "key: #{item.key}", item
    @emit "rule: #{rule}", item

    # TODO: checks for loops.

  _removeItem: (item) ->

    delete @_byKey[item.key]

    # TODO: Cascades changes.

#=====================================================================

module.exports = $MappedCollection2
