const noop = () => {}

const LOAD_BALANCER_DEBUG = 1

// Delay between each ressources evaluation in minutes.
// Must be less than MINUTES_OF_HISTORICAL_DATA.
export const EXECUTION_DELAY = 1

// ===================================================================

export const debug = LOAD_BALANCER_DEBUG
  ? str => console.log(`[load-balancer]${str}`)
  : noop

// Compare a list of objects and give the best.
export function searchObject (objects, fun) {
  let object = objects[0]

  for (let i = 1; i < objects.length; i++) {
    if (fun(object, objects[i]) > 0) {
      object = objects[i]
    }
  }

  return object
}
