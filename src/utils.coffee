$done = exports.$done = {}

# Similar to `lodash.map()` for array and `lodash.mapValues()` for objects.
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

  return result

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

  return col

# Wraps a value in a function.
exports.$wrap = (val) -> -> val

#=====================================================================

$fs = require 'fs'

$Promise = require 'bluebird'

exports.$fileExists = (path) ->
  return new Promise (resolve) ->
    $fs.exists path, resolve
    return

exports.$readFile = $Promise.promisify $fs.readFile
