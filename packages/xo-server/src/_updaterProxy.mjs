import proxyAddr from 'proxy-addr'
import { parse as parseCookies } from 'cookie'

import { invalidCredentials } from 'xo-common/api-errors.js'

const UPDATER_PROXY_PATH_RE = /^\/(?:v5\/)?api\/updater(?:[/?]|$)/

export function isUpdaterProxyPath(url) {
  return UPDATER_PROXY_PATH_RE.test(url)
}

export async function authenticateUpdater(req, xo, useForwardedHeaders) {
  const { token } = parseCookies(req.headers.cookie)
  const remoteAddress = proxyAddr(req, useForwardedHeaders)
  const { user } = await xo.authenticateUser({ token }, { ip: remoteAddress })

  if (user.permission !== 'admin') {
    throw invalidCredentials()
  }
}
