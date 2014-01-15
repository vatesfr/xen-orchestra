# Low level tools.
$_ = require 'underscore'

# Async code is easier with fibers (light threads)!
$fiber = require 'fibers'

$Q = require 'q'

#=====================================================================

$isPromise = (obj) -> obj? and $_.isFunction obj.then

#=====================================================================

# Makes a function running in its own fiber.
$fiberize = (fn) ->
  (args...) ->
    $fiber(=> fn.apply this, args).run()

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

# Makes the fiber waits for a number of milliseconds.
$sleep = (ms) ->
  fiber = $fiber.current
  setTimeout (-> fiber.run()), ms
  $fiber.yield()

# Makes an Node like asynchronous function synchronous (in a fiber).
$synchronize = (fn, ctx) ->
  fn = ctx[fn] if $_.isString fn

  (args...) ->
    fiber = $fiber.current
    throw new Error 'not running in a fiber' unless fiber?

    args.push (error, result) ->
      if error?
        fiber.throwInto error
      else
        fiber.run result
    fn.apply ctx, args

    $fiber.yield()

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
$wait = (value) ->
  fiber = $fiber.current
  throw new Error 'not running in a fiber' unless fiber?

  if $isPromise value
    value.then(
      (result) -> fiber.run result
      (error) -> fiber.throwInto error
    )
  else if $_.isFunction value
    # It should be a thunk.
    value (error, result) ->
      if error?
        fiber.throwInto error
      else
        fibre.run result
  else
    # TODO: handle array and object of promises/thunks.

    # No idea what is it, just forwards.
    return value

  $fiber.yield()

#=====================================================================

module.exports = {
  $fiberize
  $promisify
  $sleep
  $synchronize
  $waitEvent
  $wait
}
