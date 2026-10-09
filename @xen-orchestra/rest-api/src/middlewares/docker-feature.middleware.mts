import type { NextFunction, Request, Response } from 'express'

import { iocContainer } from '../ioc/ioc.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'

/**
 * Class-level middleware of the Docker controllers, before the handler and the
 * route middlewares (body parsing, acl): an unlicensed XOA must not store
 * credentials nor open SSH sessions.
 */
export function dockerFeatureMiddleware(_req: Request, _res: Response, next: NextFunction): void {
  iocContainer
    .get(RestApi)
    .xoApp.checkFeatureAuthorization('DOCKER')
    .then(() => next(), next)
}
