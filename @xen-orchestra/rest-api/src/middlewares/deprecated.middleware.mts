import { createLogger } from '@xen-orchestra/log'
import type { NextFunction, Request, Response } from 'express'

const log = createLogger('xo:rest-api:deprecated.middleware')

export function vmExportCompressDeprecated(req: Request, _res: Response, next: NextFunction) {
  const compress = req.query.compress
  if (compress === 'true' || compress === 'false') {
    log.warn("the query param 'compress' as boolean is deprecated. Please use an explicit value next time")
    req.query.compress = compress === 'true' ? 'gzip' : undefined
  }

  next()
}
