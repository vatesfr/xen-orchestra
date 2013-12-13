# Async code is easier with fibers (light threads)!
$fiber = require 'fibers'

#=====================================================================

# Makes a function running in its own fiber.
$fiberize = (fn) ->
  (args...) ->
    $fiber(-> fn args...).run()

# Makes an asynchrouneous function synchrouneous (in a fiber).
$synchronize = (fn) ->
  (args...) ->
    fiber = $fiber.current
    fn args..., (error, result) ->
      if error?
        fiber.throwInto error
      else
        fiber.run result
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
  $synchronize
  $waitForPromise
}
