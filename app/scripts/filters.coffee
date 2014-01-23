angular.module('xoWebApp')

  # The bytes filters takes a number and formats it using adapted
  # units (KB, MB, etc.).
  .filter 'bytes', ->
    (size, unit, base) ->
      unit ?= 'B'
      base ?= 1024
      powers = ['', 'K', 'M', 'G', 'T', 'P']

      i = 0
      while size > base
        size /= base
        ++i

      if size is -1
        "-"
      else
        # Maximum 1 decimals.
        size = ((size * 10)|0) / 10
        "#{size}#{powers[i]}B"

  # Simply returns the number of elements in the collection.
  .filter 'count', ->
    (collection) ->
      # Array.
      if angular.isArray collection
        return collection.length

      # Object.
      count = 0
      for key of collection
        ++count if collection.hasOwnProperty key

      count

  # Resolves links between objects.
  .filter 'resolve', (xoObjects) ->
    {get} = xoObjects

    (ref) ->
      if angular.isArray ref
        refs = ref
        get ref for ref in refs
      else
        get ref

  # Applies a function to a list of items.
  #
  # If a string is used instead of a function, it will be used as a
  # property name to extract from each item.
  #
  # Note: This filter behaves nicely if the first argument is not an
  # array.
  .filter 'map', ->
    (items, fn) ->
      unless angular.isArray items
        return []

      if angular.isString fn
        property = fn
        fn = (item) -> item[property]

      fn item for item in items

  .filter '%', ->
    (value) ->
      # If `value` is an array of two values, divide the first by the
      # second and mutiply by 100.
      if value.length is 2

        # Special case, if the divider is 0, simply returns "N/A".
        return 'N/A' if value[1] is 0

        result = 100 * value[0] / value[1]
        if Number.isNaN result
          return 'N/A'

        value = result

      # No decimals at most.
      value = (Math.round value * 1e0) / 1e0

      "#{value}%"
