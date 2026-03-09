import { Request, Response, NextFunction } from 'express'
import { createLogger } from '@xen-orchestra/log'

const log = createLogger('xo:rest-api')

export function logMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - start
    const { method, originalUrl } = req
    const { statusCode } = res

    log.debug(`[${new Date().toISOString()}] ${method} ${originalUrl} ${statusCode} ${duration}ms`)
  })

  next()
}
