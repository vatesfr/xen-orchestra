import { createLogger } from '@xen-orchestra/log'
import { NextFunction, Request, Response } from 'express'
import { unauthorized } from 'xo-common/api-errors.js'

import { iocContainer } from '../ioc/ioc.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import type { XoApp } from '../rest-api/rest-api.type.mjs'
import type { AuthenticatedRequest } from '../helpers/helper.type.mjs'
import { ApiError } from '../helpers/error.helper.mjs'

const log = createLogger('xo:rest-api:authentication')

export type SecurityName = '*' | 'token' | 'basic'

// TODO: correctly handle ACL/Resource set users
// for now only support "xoa-admin"
export async function expressAuthentication(req: AuthenticatedRequest, securityName: SecurityName) {
  const restApi = iocContainer.get(RestApi)
  const user = restApi.getCurrentUser()
  const authType = req.res.locals.authType

  if (securityName !== '*' && authType !== securityName) {
    throw new ApiError(`invalid authentification. please use ${securityName} authentication`, 401)
  }

  if (user.permission !== 'admin') {
    log.error(`The REST API can only be used by 'xoa-admin' users for now. Your permission: ${user.permission}`)
    throw unauthorized()
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
      throw new ApiError('Having multiple authentication methods is not supported, please choose one', 400)
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
        throw new ApiError('Malformed Authorization header', 400)
      }

      const [username, password] = Buffer.from(encoded, 'base64').toString().split(':')
      Object.assign(credentials, { username, password, otp: query.otp })
      res.locals.authType = 'basic'
    }

    const { user } = await xoApp.authenticateUser(credentials, { ip })
    return xoApp.runWithApiContext(user, next)
  }
}
