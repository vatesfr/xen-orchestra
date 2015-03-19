Bluebird = require 'bluebird'
Fiber = require 'fibers'
forEach = require 'lodash.foreach'
isArray = require 'lodash.isarray'
isFunction = require 'lodash.isfunction'
isObject = require 'lodash.isobject'

#=====================================================================

isPromise = (obj) -> obj? and isFunction obj.then

# The value is guarantee to resolve asynchronously.
runAsync = (value, resolve, reject) ->
  if isPromise value
    return value.then resolve, reject

  if isFunction value # Continuable
    handler = (error, result) ->
      if error?
        reject error
      else
        resolve result
      return

    sync = true
    value (error, result) ->
      if sync
        process.nextTick -> handler error, result
      else
        handler error, result
      return
    sync = false
    return

  unless isObject value
    return process.nextTick -> resolve value

  left = 0
  results = if isArray value
    new Array value.length
  else
    Object.create null

  forEach value, (value, index) ->
    ++left
    runAsync(
      value
      (result) ->
        # Returns if already rejected.
        return unless results

        results[index] = result
        resolve results unless --left
      (error) ->
        # Returns if already rejected.
        return unless results

        # Frees the reference ASAP.
        results = null

        reject error
    )
    return

  if left is 0
    process.nextTick -> resolve value

#=====================================================================

# Makes a function run in its own fiber and returns a promise.
coroutine = (fn) ->
  return (args...) ->
    return new Bluebird (resolve, reject) =>
      new Fiber(=>
        try
          resolve fn.apply this, args
        catch error
          reject error
      ).run()
      return
exports.coroutine = coroutine

# Waits for a promise or a continuable to end.
#
# If value is composed (array or map), every asynchronous value is
# resolved before returning (parallelization).
wait = (value) ->
  fiber = Fiber.current
  throw new Error 'not running in a fiber' unless fiber?

  runAsync(
    value
    (value) -> fiber.run value
    (error) -> fiber.throwInto error
  )

  return Fiber.yield()
exports.wait = wait

#=====================================================================

# Compatibility.
exports.$coroutine = coroutine
exports.$wait = wait
