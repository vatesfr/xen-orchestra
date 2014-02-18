# Low level tools.
$_ = require 'underscore'

# Async code is easier with fibers (light threads)!
$fiber = require 'fibers'

$Q = require 'q'

#=====================================================================

$isPromise = (obj) -> obj? and $_.isFunction obj.then

$runAsync = (value, resolve, reject) ->
  if $isPromise value
    return value.then resolve, reject

  if $_.isFunction value # Thunk
    return value (error, result) ->
      if error?
        return reject error
      resolve result

  unless $_.isObject value
    return resolve value

  left = 0
  results = null
  compositeReject = (error) ->
    # Returns if already rejected.
    return unless results

    # Frees the reference ASAP.
    results = null

    reject error
  compositeHandler = (value, index) ->
    ++left
    $runAsync(
      value
      (result) ->
        # Returns if already rejected.
        return unless results

        results[index] = result
        resolve results unless --left
      compositeReject
    )

  if $_.isArray value
    results = new Array value.length
    return value.forEach compositeHandler

  # Plain object.
  results = Object.create null
  $_.each value, compositeHandler

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
    deferred = $Q.defer()

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

# Waits for a promise or a thunk to end.
#
# If value is composed (array or map), every asynchronous value is
# resolved before returning (parallelization).
$wait = (value) ->
  fiber = $fiber.current
  throw new Error 'not running in a fiber' unless fiber?

  if $wait._stash
    value = $wait._stash
    delete $wait._stash

  # Must be called asynchronously to avoid running the fiber before
  # having yielding it.
  process.nextTick ->
    $runAsync(
      value
      fiber.run.bind fiber
      fiber.throwInto.bind fiber
    )

  $fiber.yield()

$wait.register = ->
  throw new Error 'something has already been registered' if $wait._stash

  deferred = $Q.defer()
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
