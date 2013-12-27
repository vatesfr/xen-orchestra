# Low level tools.
$_ = require 'underscore'

# Async code is easier with fibers (light threads)!
$fiber = require 'fibers'

#=====================================================================

$isPromise = (obj) -> obj? and $_.isFunction obj.then

#=====================================================================

# Makes a function running in its own fiber.
$fiberize = (fn) ->
  (args...) ->
    $fiber(-> fn args...).run()

# Makes the fiber waits for a number of miliseconds.
$sleep = (ms) ->
  fiber = $fiber.current
  setTimeout (-> fiber.run()), ms
  $fiber.yield()

# Makes an Node like asynchrouneous function synchrouneous (in a
# fiber).
$synchronize = (fn, ctx) ->
  fn = ctx[fn] if $_.isString fn

  (args...) ->
    fiber = $fiber.current

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

# Waits for a promise to be fulfilled or broken.
$waitPromise = (promise) ->
  fiber = $fiber.current

  promise.then(
    (result) -> fiber.run result
    (error) -> fiber.throwInto error
  )

  $fiber.yield()

#=====================================================================

module.exports = {
  $fiberize
  $sleep
  $synchronize
  $waitEvent
  $waitPromise
}
