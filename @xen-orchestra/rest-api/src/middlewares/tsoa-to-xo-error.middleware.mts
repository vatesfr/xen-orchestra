import { invalidParameters } from 'xo-common/api-errors.js'
import { NextFunction, Request, Response } from 'express'
import { ValidateError } from 'tsoa'

export default function tsoaToXoErrorHandler(error: unknown, _req: Request, _res: Response, next: NextFunction) {
  if (error instanceof ValidateError) {
    /* throw */ invalidParameters(error.fields)
  }

  return next(error)
}
