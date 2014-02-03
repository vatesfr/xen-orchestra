$done = {}

# Similar to `$_.each()` but can be interrupted by returning the
# special value `done` provided as the forth argument.
exports.$each = (col, iterator, ctx) ->
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

exports.$makeFunction = (val) -> -> val

# Similar to `$_.map()` for array and `$_.mapValues()` for objects.
#
# Note: can  be interrupted by returning the special value `done`
# provided as the forth argument.
exports.$map = (col, iterator, ctx) ->
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
exports.$mapInPlace = (col, iterator, ctx) ->
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
