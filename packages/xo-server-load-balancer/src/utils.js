const noop = () => {}

const LOAD_BALANCER_DEBUG = 1

// Delay between each ressources evaluation in minutes.
// Must be less than MINUTES_OF_HISTORICAL_DATA.
export const EXECUTION_DELAY = 1

// ===================================================================

export const debug = LOAD_BALANCER_DEBUG ? str => console.log(`[load-balancer]${str}`) : noop
