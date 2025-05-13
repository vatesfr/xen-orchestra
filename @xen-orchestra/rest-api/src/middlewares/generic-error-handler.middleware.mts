import { createLogger } from '@xen-orchestra/log'
import {
  featureUnauthorized,
  forbiddenOperation,
  invalidCredentials,
  invalidParameters,
  noSuchObject,
  notImplemented,
  objectAlreadyExists,
  unauthorized,
} from 'xo-common/api-errors.js'
import { NextFunction, Request, Response } from 'express'

const log = createLogger('xo:rest-api:error-handler')

// must have 4 parameters to be recognized as an error middleware by express
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function genericErrorHandler(error: unknown, req: Request, res: Response, _next: NextFunction) {
  if (!(error instanceof Error)) {
    log.error(error)
    res.status(500).json({ error })
    return
  }

  const responseError: { error: string; info?: string } = { error: error.message }
  if (noSuchObject.is(error)) {
    res.status(404)
  } else if (unauthorized.is(error) || forbiddenOperation.is(error) || featureUnauthorized.is(error)) {
    res.status(403)
  } else if (invalidCredentials.is(error)) {
    res.status(401)
  } else if (objectAlreadyExists.is(error)) {
    res.status(409)
  } else if (invalidParameters.is(error)) {
    res.status(422)
  } else if (notImplemented.is(error)) {
    res.status(501)
  } else {
    if (error.name === 'XapiError') {
      responseError.info = 'This is a XenServer/XCP-ng error, not an XO error'
    }
    res.status(500)
    log.error(error)
  }

  log.info(`[${req.method}] ${req.path} (${res.statusCode})`)

  res.json(responseError)
}
