import * as express from 'express'
import { getRestApi } from '../index.js'

export async function expressAuthentication(
  req: express.Request,
  securityName: string,
  scopes?: string[]
): Promise<any> {
  const restApi = getRestApi()
  const ip = req.ip
  const permission = scopes?.[0]

  if (securityName === 'token') {
    const token = req.cookies.token ?? req.cookies.authenticationToken

    const { user } = await restApi.authenticateUser({ token }, { ip })
    if (permission !== undefined && permission !== user.permission) {
      return Promise.reject(new Error('unauthorize'))
    }
    return Promise.resolve(user)
  }

  if (securityName === 'basic_auth') {
    const authorization = req.headers.authorization ?? ''
    const [, encodedCredentials] = authorization.split(' ')
    if (encodedCredentials === undefined) {
      return Promise.reject(new Error('missing credentials'))
    }

    const [username, password] = Buffer.from(encodedCredentials, 'base64').toString().split(':')
    const { user } = await restApi.authenticateUser({ username, password }, { ip })
    if (permission !== undefined && permission !== user.permission) {
      return Promise.reject(new Error('unauthorize'))
    }
    return Promise.resolve(user)
  }

  throw new Error('unimplemented')
}
