import { NextFunction, Request, Response } from 'express'
import { noSuchObject } from 'xo-common/api-errors.js'

export default function notFoundErrorMiddleware(err: Error, _request: Request, res: Response, next: NextFunction) {
  if (noSuchObject.is(err)) {
    return res.status(404).json({ error: err.message })
  }

  next(err)
}
