# Low level tools.
$_ = require 'underscore'

# Async code is easier with fibers (light threads)!
$fiber = require 'fibers'

$Promise = require 'bluebird'

#=====================================================================

$isPromise = (obj) -> obj? and $_.isFunction obj.then

# The value is guarantee to resolve asynchronously.
$runAsync = (value, resolve, reject) ->
  if $isPromise value
    return value.then resolve, reject

  if $_.isFunction value # Continuable
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

  unless $_.isObject value
    return process.nextTick -> resolve value

  left = 0
  results = if $_.isArray value
    new Array value.length
  else
    Object.create null

  $_.each value, (value, index) ->
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

  if left is 0
    process.nextTick -> resolve value

#=====================================================================

# Makes a function running in its own fiber.
$fiberize = (fn) ->
  (args...) ->
    $fiber(=>
      try
        fn.apply this, args
      catch error
        process.nextTick ->
          throw error
    ).run()

# Makes a function run in its own fiber and returns a promise.
#
# TODO: should we keep it?
$promisify = (fn) ->
  (args...) ->
    deferred = $Promise.defer()

    $fiber(=>
      try
        deferred.resolve fn.apply this, args
      catch error
        deferred.reject error
    ).run()

    deferred.promise

# Waits for an event.
#
# Note: if the *error* event is emitted, this function will throw.
$waitEvent = (emitter, event) ->
  fiber = $fiber.current
  throw new Error 'not running in a fiber' unless fiber?

  errorHandler = null
  handler = (args...) ->
    emitter.removeListener 'error', errorHandler
    fiber.run args
  errorHandler = (error) ->
    emitter.removeListener event, handler
    fiber.throwInto error

  emitter.once event, handler
  emitter.once 'error', errorHandler

  $fiber.yield()

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

  $fiber.yield()

$wait.register = ->
  throw new Error 'something has already been registered' if $wait._stash

  deferred = $Promise.defer()
  $wait._stash = deferred.promise

  (error, result) ->
    if error?
      return deferred.reject error
    deferred.resolve result

#=====================================================================

module.exports = {
  $fiberize
  $promisify
  $waitEvent
  $wait
}
