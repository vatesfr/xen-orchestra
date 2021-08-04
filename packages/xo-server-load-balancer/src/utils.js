import { createLogger } from '@xen-orchestra/log'

export const { info: log } = createLogger('xo:load-balancer')

// Delay between each resources evaluation in minutes.
// Must be less than MINUTES_OF_HISTORICAL_DATA.
export const EXECUTION_DELAY = 1
