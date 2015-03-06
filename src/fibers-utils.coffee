$fiber = require 'fibers'
$forEach = require 'lodash.foreach'
$isArray = require 'lodash.isarray'
$isFunction = require 'lodash.isfunction'
$isObject = require 'lodash.isobject'
$Promise = require 'bluebird'

#=====================================================================

$isPromise = (obj) -> obj? and $isFunction obj.then

# The value is guarantee to resolve asynchronously.
$runAsync = (value, resolve, reject) ->
  if $isPromise value
    return value.then resolve, reject

  if $isFunction value # Continuable
    async = false
    handler = (error, result) ->
      unless async
        return process.nextTick handler.bind null, error, result
      if error?
        return reject error
      resolve result
    value handler
    async = true
    return

  unless $isObject value
    return process.nextTick -> resolve value

  left = 0
  results = if $isArray value
    new Array value.length
  else
    Object.create null

  $forEach value, (value, index) ->
    ++left
    $runAsync(
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
$coroutine = (fn) ->
  return (args...) ->
    return new $Promise (resolve, reject) =>
      $fiber(=>
        try
          resolve fn.apply this, args
        catch error
          reject error
      ).run()
      return
exports.$coroutine = $coroutine

# Waits for a promise or a continuable to end.
#
# If value is composed (array or map), every asynchronous value is
# resolved before returning (parallelization).
$wait = (value) ->
  fiber = $fiber.current
  throw new Error 'not running in a fiber' unless fiber?

  if $wait._stash
    value = $wait._stash
    delete $wait._stash

  $runAsync(
    value
    fiber.run.bind fiber
    fiber.throwInto.bind fiber
  )

  return $fiber.yield()
exports.$wait = $wait

$wait.register = ->
  throw new Error 'something has already been registered' if $wait._stash

  resolve = reject = null
  $wait._stash = new $Promise (resolve_, reject_) ->
    resolve = resolve_
    reject = reject_
    return

  return (error, result) ->
    if error
      reject error
    else
      resolve result
    return
