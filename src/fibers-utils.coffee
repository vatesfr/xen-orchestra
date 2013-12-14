# Low level tools.
$_ = require 'underscore'

# Async code is easier with fibers (light threads)!
$fiber = require 'fibers'

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

# Makes an asynchrouneous function synchrouneous (in a fiber).
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

# TODO: remove promises ASAP.
$waitForPromise = (promise) ->
  fiber = $fiber.current
  promise.then(
    (value) -> fiber.run value
    (error) -> fiber.throwInto error
  )
  $fiber.yield()

#=====================================================================

module.exports = {
  $fiberize
  $sleep
  $synchronize
  $waitForPromise
}
