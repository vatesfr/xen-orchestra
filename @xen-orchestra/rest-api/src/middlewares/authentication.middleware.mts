import { createLogger } from '@xen-orchestra/log'
import { NextFunction, Request, Response } from 'express'
import { unauthorized } from 'xo-common/api-errors.js'

import { iocContainer } from '../ioc/ioc.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import type { XoApp } from '../rest-api/rest-api.type.mjs'
import type { XoUser } from '@vates/types'

const log = createLogger('xo:rest-api:authentication')

// TODO: correctly handle ACL/Resource set users
// for now only support "xoa-admin"
export async function expressAuthentication() {
  const restApi = iocContainer.get(RestApi)
  const user = restApi.getCurrentUser()

  if (user.permission !== 'admin') {
    log.error(`The REST API can only be used by 'xoa-admin' users for now. Your permission: ${user.permission}`)
    throw unauthorized()
  }

  return user
}

export function setupApiContext(xoApp: XoApp) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { cookies, ip } = req
    const token = cookies.authenticationToken ?? cookies.token

    let user: XoUser | undefined
    if (token !== undefined) {
      user = (await xoApp.authenticateUser({ token }, { ip })).user
    }

    return xoApp.runWithApiContext(user, next)
  }
}
