import { noSuchObject } from 'xo-common/api-errors.js'

import { NextFunction, Request, Response } from 'express'

export function errorHandler(err: Error, _req: Request, res: Response, next: NextFunction) {
  console.error(err) // use log.error instead
  if (noSuchObject.is(err)) {
    res.status(404).json({ error: err.message })
    return next()
  }

  res.json({ error: err.message })

  next()
}
