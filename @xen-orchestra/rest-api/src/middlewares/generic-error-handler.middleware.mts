import { createLogger } from '@xen-orchestra/log'
import {
  featureUnauthorized,
  forbiddenOperation,
  invalidParameters,
  noSuchObject,
  unauthorized,
} from 'xo-common/api-errors.js'
import { NextFunction, Request, Response } from 'express'

const log = createLogger('xo:rest-api:error-handler')

// must have 4 parameters to be recognized as an error middleware by express
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function notFoundErrorMiddleware(error: unknown, req: Request, res: Response, _next: NextFunction) {
  if (!(error instanceof Error)) {
    log.error(error)
    res.status(500).json({ error })
    return
  }

  if (noSuchObject.is(error)) {
    res.status(404)
  } else if (forbiddenOperation.is(error) || featureUnauthorized.is(error)) {
    res.status(403)
  } else if (unauthorized.is(error)) {
    res.status(401)
  } else if (invalidParameters.is(error)) {
    res.status(400)
  } else {
    res.status(500)
    log.error(error)
  }

  log.info(`[${req.method}] ${req.path} (${res.statusCode})`)

  res.json({ error: error.message })
}
