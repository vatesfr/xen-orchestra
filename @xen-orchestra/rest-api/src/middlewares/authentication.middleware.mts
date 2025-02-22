import { createLogger } from '@xen-orchestra/log'
import { Request } from 'express'
import { invalidCredentials, notImplemented, unauthorized } from 'xo-common/api-errors.js'

import { iocContainer } from '../ioc/ioc.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'

type SecurityName = '*' | 'token' | 'basic'

const noop = () => {}
const log = createLogger('xo:rest-api:authentication')

function getCredentials(
  securityName: SecurityName,
  req: Request
): { token?: string; username?: string; password?: string } | undefined {
  const token = req.cookies.token ?? req.cookies.authenticationToken

  if (securityName === '*' || securityName === 'token') {
    if (token !== undefined) {
      return { token }
    }
    return
  }

  log.error(`${securityName} not implemented.`)
  throw notImplemented()
}

// TODO: correctly handle ACL/Resource set users
// for now only support "xoa-admin"
export async function expressAuthentication(req: Request, securityName: SecurityName) {
  const restApi = iocContainer.get(RestApi)
  const ip = req.ip

  const credentials = getCredentials(securityName, req)
  if (credentials === undefined) {
    throw invalidCredentials()
  }

  const { user } = await restApi.authenticateUser(credentials, { ip })
  if (user.permission !== 'admin') {
    log.error(`The REST API can only be used by 'xoa-admin' users for now. Your permission: ${user.permission}`)
    throw unauthorized()
  }

  await restApi.runWithApiContext(user, noop)
  Promise.resolve(user)
}
