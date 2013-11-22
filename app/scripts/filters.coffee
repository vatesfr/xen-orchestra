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

  # Fetches XO objects from UUIDs.
  .filter 'fromUUID', (objects) ->
    byUUIDs = objects.byUUIDs

    (UUID) ->
      if angular.isArray UUID
        UUIDs = UUID
        byUUIDs[UUID] for UUID in UUIDs
      else
        byUUIDs[UUID]

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
