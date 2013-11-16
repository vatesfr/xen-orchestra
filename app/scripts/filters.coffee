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
