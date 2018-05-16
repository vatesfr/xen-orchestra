import createLogger from '@xen-orchestra/log'
import { catchGlobalErrors } from '@xen-orchestra/log/configure'

const logger = createLogger('xo:proxy:worker')
catchGlobalErrors(logger)

// eslint-disable-next-line no-unused-vars
const config = JSON.parse(process.env.XO_CONFIG)
