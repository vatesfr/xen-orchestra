import { NextFunction, Request, Response } from 'express'
import { ValidateError } from 'tsoa'
import { invalidParameters } from 'xo-common/api-errors.js'

export default function tsoaToXoErrorHandler(error: unknown, _req: Request, _res: Response, next: NextFunction) {
  if (!(error instanceof ValidateError)) {
    return next(error)
  }

  invalidParameters(error.fields)
}
