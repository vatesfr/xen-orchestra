import { Request } from 'express'
import { unauthorized } from 'xo-common/api-errors.js'

import { iocContainer } from '../ioc/ioc.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'

const noop = () => {}

// TODO: correctly handle ACL/Resource set users
// for now only support "super-admin"
export async function expressAuthentication(req: Request) {
  const restApi = iocContainer.get(RestApi)
  const ip = req.ip
  const token = req.cookies.token ?? req.cookies.authenticationToken

  const { user } = await restApi.authenticateUser({ token }, { ip })
  if (user.permission !== 'admin') {
    /* throw */ unauthorized()
  }

  await restApi.runWithApiContext(user, noop)
  Promise.resolve(user)
}
