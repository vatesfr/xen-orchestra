import { createLogger } from '@xen-orchestra/log'
import {
  featureUnauthorized,
  forbiddenOperation,
  incorrectState,
  invalidCredentials,
  invalidParameters,
  noSuchObject,
  notImplemented,
  objectAlreadyExists,
  unauthorized,
} from 'xo-common/api-errors.js'
import type { HttpStatusCodeLiteral } from 'tsoa'
import { NextFunction, Request, Response } from 'express'

import type { XoError } from '../helpers/helper.type.mjs'

const log = createLogger('xo:rest-api:error-handler')

// must have 4 parameters to be recognized as an error middleware by express
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function genericErrorHandler(error: unknown, req: Request, res: Response, _next: NextFunction) {
  if (!(error instanceof Error)) {
    log.error(error)
    res.status(500).json({ error })
    return
  }

  const responseError: { error: string; data?: Record<string, unknown>; info?: string } = { error: error.message }
  let statusCode: HttpStatusCodeLiteral

  if (noSuchObject.is(error)) {
    statusCode = 404
  } else if (unauthorized.is(error) || forbiddenOperation.is(error)) {
    statusCode = 403
  } else if (featureUnauthorized.is(error)) {
    statusCode = 403
    responseError.data = (error as XoError).data
  } else if (invalidCredentials.is(error)) {
    statusCode = 401
  } else if (objectAlreadyExists.is(error)) {
    statusCode = 409
  } else if (invalidParameters.is(error)) {
    statusCode = 422
  } else if (notImplemented.is(error)) {
    statusCode = 501
  } else if (incorrectState.is(error)) {
    statusCode = 409
    responseError.data = (error as XoError).data
  } else {
    if (error.name === 'XapiError') {
      responseError.info = 'This is a XenServer/XCP-ng error, not an XO error'
    }
    statusCode = 500
    log.error(error)
  }

  log.info(`[${req.method}] ${req.path} (${statusCode})`)

  if (res.headersSent) {
    return
  }

  res.status(statusCode).json(responseError)
}
