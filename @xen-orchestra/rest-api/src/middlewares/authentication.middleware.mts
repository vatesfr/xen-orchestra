import { createLogger } from '@xen-orchestra/log'
import type { NextFunction, Request, Response } from 'express'
import { unauthorized } from 'xo-common/api-errors.js'

import { iocContainer } from '../ioc/ioc.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import type { XoApp } from '../rest-api/rest-api.type.mjs'
import type { AuthenticatedRequest } from '../helpers/helper.type.mjs'
import { ApiError } from '../helpers/error.helper.mjs'

const log = createLogger('xo:rest-api:authentication')

export type SecurityName = '*' | 'token' | 'basic' | 'none'

export function acl(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // TODO
  next()
}

// TSOA spec require this function to be async
export async function expressAuthentication(req: AuthenticatedRequest, securityName: SecurityName) {
  if (securityName === 'none') {
    return undefined
  }

  const restApi = iocContainer.get(RestApi)
  const user = restApi.getCurrentUser()
  const authType = req.res.locals.authType

  if (securityName !== '*' && authType !== securityName) {
    throw new ApiError(`invalid authentification. please use ${securityName} authentication`, 401)
  }

  if (user.permission !== 'admin') {
    // If user is not admin, ensure an ACL middleware is set on the endpoint. Otherwise throw unauthorized
    const currentPosition = req.route.stack.findIndex(layer => layer.name === expressAuthentication.name)
    const hasAclMiddleware = req.route.stack.slice(currentPosition + 1).some(layer => layer.name === acl.name)
    if (!hasAclMiddleware) {
      log.error(`This endpoint can only be used by 'xoa-admin' users for now. Your permission: ${user.permission}`)
      throw unauthorized()
    }
  }

  return user
}

export function setupApiContext(xoApp: XoApp) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { cookies, headers, ip, query } = req
    const { authorization } = headers
    const token = cookies.authenticationToken ?? cookies.token

    const hasToken = Boolean(token)
    const hasBasic = Boolean(authorization)

    if (hasToken && hasBasic) {
      return next(new ApiError('Having multiple authentication methods is not supported, please choose one', 400))
    }

    if (!hasToken && !hasBasic) {
      return xoApp.runWithApiContext(undefined, next)
    }

    const credentials = {}
    if (hasToken) {
      Object.assign(credentials, { token })
      res.locals.authType = 'token'
    } else {
      const [, encoded] = authorization!.split(' ')
      if (encoded === undefined) {
        return next(new ApiError('Malformed Authorization header', 400))
      }

      const [username, password] = Buffer.from(encoded, 'base64').toString().split(':')
      Object.assign(credentials, { username, password, otp: query.otp })
      res.locals.authType = 'basic'
    }

    try {
      const { user } = await xoApp.authenticateUser(credentials, { ip })
      return xoApp.runWithApiContext(user, next)
    } catch (error) {
      return next(error)
    }
  }
}
