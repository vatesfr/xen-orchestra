# Low level tools.
$_ = require 'underscore'

#=====================================================================

class $DynamicProperty

  constructor: (@value, @hooks) ->

#=====================================================================

$noop = ->

$copyDeep = (value) ->
  if value instanceof Array
    return ($copyDeep item for item in value)

  if value instanceof Object
    result = {}
    result[key] = $copyDeep item for key, item of value
    return result

  return value

$getDeep = (obj, path) ->
  return obj if path.length is 0

  current = obj

  i = 0
  n = path.length - 1
  while i < n
    current = current[path[i++]]
    throw new Error 'invalid path component' if current is undefined

  current[path[i]]

$setDeep = (obj, path, value) ->
  throw new Error 'invalid path' if path.length is 0

  current = obj

  i = 0
  n = path.length - 1
  while i < n
    current = current[path[i++]]
    throw new Error 'invalid path component' if current is undefined

  current[path[i]] = value

# @param rule Rule of the current item.
# @param item Current item.
# @param value Value of the generator item.
$computeValue = (rule, item) ->
  value = item.generator

  # @param parent The parent object of this entry (necessary for
  #   assignment).
  # @param name The name of this entry.
  # @param spec Specification for the current entry.
  #
  # @returns The generated value for this entry.
  helper = (parent, name, spec) ->
    if not $_.isObject spec
      parent[name] = spec
    else if spec instanceof $DynamicProperty
      # If there was no previous value use $DynamicProperty.value,
      # otherwise, just keep the previous value.
      if parent[name] is undefined
        # Helper is re-called for the initial value.
        helper parent, name, spec.value
    else if $_.isFunction spec
      ctx = {rule}
      ctx.__proto__ = item # Links to the current item.
      parent[name] = spec.call ctx, value, item.key
    else if $_.isArray spec
      current = parent[name] or= new Array spec.length
      for entry, index in spec
        helper current, index, entry
    else
      # It's a plain object.
      current = parent[name] or= {}
      for key, property of spec
        helper current, key, property

  helper item, 'value', rule.value

######################################################################

class $MappedCollection

  constructor: (spec) ->

    # If spec is a function, it is called with various helpers in
    # `this`.
    if $_.isFunction spec
      ctx =
        dynamic: (initialValue, hooks) ->
          new $DynamicProperty initialValue, hooks
        noop: $noop

      spec = spec.call ctx

    # This key function returns the identifier used to map the
    # generator to the generated item.
    #
    # The default function uses the index if the generator collection
    # is an array or the property name if it is an object.
    #
    # /!\: This entry MUST be overriden in rules for new items.
    if spec.key?
      @_key = spec.key
      throw new Error 'key must be a function' unless $_.isFunction @_key
    else
      @_key = (_, key) -> key

    spec.rules or= {}

    # Rules are the core of $MappedCollection, they allow to categorize
    # objects and to treat them differently.
    @_rules = {}

    # Hooks are functions which are run when a item of a given rule
    # enters, exists or is updated.
    @_hooks = {}

    # Initialy the collection is empty.
    @_byKey = {}

    # For performance concerns, items are also categorized by rules.
    @_byRule = {}

    # Rules are checked for conformity and created in the sytem.
    for name, def of spec.rules
      # If it's a function, runs it.
      def = def() if $_.isFunction def

      throw new Error "#{name} definition must be an object" unless $_.isObject def

      # A rule can extends another (not recursive for now!).
      if def.extends?
        unless $_.isString def.extends
          throw new Error "#{name}.extends must be a string"

        if spec.rules[def.extends] is undefined
          throw new Error "#{name}.extends must reference a valid rule (#{def.extends})"

        $_.defaults def, spec.rules[def.extends]

      rule = {name}

      if def.key?
        # Static rule, used to create a new item (without generator).

        throw new Error "both #{name}.key and #{name}.test cannot be defined" if def.test?

        # The key MUST be a string.
        throw new Error "#{name}.key must be a string" unless $_.isString def.key

        rule.key = if $_.isFunction def.key then def.key() else def.key
      else if def.test?
        # Dynamic rule, used to create new items from generator items.

        # The test MUST be a function.
        throw new Error "#{name}.test must be a function" unless $_.isFunction def.test

        rule.test = def.test
      else
        # Invalid rule!
        throw new Error "#{name} must have either a key or a test entry"

      # A rule must have a value.
      throw new Error "#{name}.value must be defined" unless def.value?

      rule.value = def.value

      @_rules[name] = rule
      @_hooks[name] =
        enter: []
        update: []
        exit: []
      @_byRule[name] = {}

    # For each rules, values are browsed and hooks are created when
    # necessary (dynamic properties).
    for name, rule of @_rules or {}

      # Browse the value searching for dynamic properties/entries.
      #
      # An immediatly invoked function is used to easily handle
      # recursivity.
      browse = (value, path) =>

        # Unless the value is an object, there is nothing to browse.
        return unless $_.isObject value

        # If the value is a function, it is a factory which will be
        # called later, when an item will be created.
        return if $_.isFunction value

        # If the value is a dynamic property, grabs the initial value
        # and registers its hooks.
        if value instanceof $DynamicProperty
          hooks = value.hooks

          # Browse hooks for each rules.
          for name_, hooks_ of hooks

            # Wraps a hook.
            #
            # A hook is run with a defined environment
            wrap = (hook, rule, items) => # Last two vars are here to be protected from the environment.
              # FIXME: @_rules[name] and @_byRule are not defined at
              # this point.

              rule = @_rules[name]

              items = @_byRule[name]

              (value, key) ->
                # The current hook is runs for all items of the
                # current rule.
                for _, item of items
                  # Value of the current field.
                  field = $getDeep item.value, path

                  ctx = {rule, field}
                  ctx.__proto__ = item # Links to the current item.

                  hook.call ctx, value, key

                  # Updates the value if it changed.
                  $setDeep item.value, path if ctx.field isnt field

            # Checks each hook is correctly defined.
            {enter, update, exit} = hooks_

            enter ?= update
            @_hooks[name_].enter.push wrap(enter) if enter?

            if not update? and exit? and enter?
              update = (args...) ->
                exit.apply this, args
                enter.apply this, args
            @_hooks[name_].update.push wrap(update) if update?

            @_hooks[name_].exit.push wrap(exit) if exit?

            # OPTIMIZE: do not register hooks if they are `noop`.

            # FIXME: Hooks must be associated to the rule (because they
            # must be run for each object of this type), and to the
            # field (because it must be available through @field).

          return

        # If the value is an array, browse each entry.
        if $_.isArray value
          for entry, index in value
            browse entry, path.concat(index)
          return

        # The value is an object, browse each property.
        for key, property of value
          browse property, path.concat(key)

      browse rule.value, []

      # If it is a static rule, creates its item right now.
      if rule.key?
        # Adds the item.
        item = @_byKey[rule.key] = @_byRule[rule.name][rule.key] =
          _ruleName: rule.name
          key: rule.key
          value: undefined

        # Computes the value.
        $computeValue rule, item

        # No events for static items.

  get: (key) -> @_byKey[key]

  getAll: ->
    items = {}

    for ruleName, ruleItems of @_byRule
      rule = @_rules[ruleName]

      # Items of private rules are not exported.
      continue if rule.private

      for key, {value} of ruleItems
        items[key] = value

    items

  remove: (items) ->
    itemsToRemove = {}
    $_.each items, (value, key) =>
      key = @_key key
      item = @_byKey[key]
      if item?
        itemsToRemove[key] = item

    @_remove items

  # Adds, updates or removes items from the collections.  Items not
  # present are added, present are updated, and present in the
  # generated collection but not in the generator are removed.
  set: (items, {add, update, remove} = {}) ->
    add = true if add is undefined
    update = true if update is undefined
    remove = false if remove is undefined

    itemsToRemove = {}
    if remove
      $_.extend(itemsToRemove, @_byKey)

    $_.each items, (value, key) =>
      key = @_key value, key

      # If the item already existed.
      if @_byKey[key]?
        # Marks this item as not to be removed.
        delete itemsToRemove[key] if remove

        if update
          item = @_byKey[key]
          rule = @_rules[item._ruleName]

          # Compute the new value.
          item.generator = value
          $computeValue rule, item

          # Runs related hooks.
          for hook in @_hooks[rule.name]?.update or []
            hook item.value, item.key
      else if add
        # First we have to find to which rule this item belongs to.
        rule = do =>
          for _, rule of @_rules
            ctx = {rule}
            return rule if rule.test? and rule.test.call ctx, value, key

        # If no rule has been found, just stops.
        return unless rule

        # Adds the item.
        item = @_byKey[key] = @_byRule[rule.name][key] =
          _ruleName: rule.name
          key: key
          value: undefined
          generator: value

        # Computes the value.
        $computeValue rule, item

        # Runs related hooks.
        for hook in @_hooks[rule.name]?.enter or []
          hook item.value, item.key

    # There are keys inside only if remove is `true`.
    @_remove itemsToRemove if remove

  _remove: (items) ->
    for {_ruleName: ruleName, value}, key in items
      # If there are some hooks registered, runs them.
      for hook in @_hooks[ruleName]?.remove or []
        hook value, key

      # Removes effectively the item.
      delete @_byKey[key] @_byRule[ruleName][key]

#=====================================================================

module.exports = $MappedCollection
