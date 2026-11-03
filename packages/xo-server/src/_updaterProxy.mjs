import proxyAddr from 'proxy-addr'
import { parse as parseCookies } from 'cookie'

import { invalidCredentials } from 'xo-common/api-errors.js'

import { getProxyTargetUrl } from './_getProxyTargetUrl.mjs'

// No boundary after `updater`: proxies are matched with `startsWith`, so any
// URL extending this prefix (e.g. `/api/updater-x`) still reaches the updater
const UPDATER_PROXY_PATH_RE = /^\/(?:v5\/)?api\/updater/

export function isUpdaterProxyPath(url) {
  return UPDATER_PROXY_PATH_RE.test(url)
}

export async function authenticateUpdater(req, xo, useForwardedHeaders) {
  const { cookie } = req.headers
  const token = cookie === undefined ? undefined : parseCookies(cookie).token
  if (token === undefined) {
    throw invalidCredentials()
  }

  const remoteAddress = proxyAddr(req, useForwardedHeaders)
  const { user } = await xo.authenticateUser({ token }, { ip: remoteAddress })

  if (user.permission !== 'admin') {
    throw invalidCredentials()
  }
}

export function createProxyUpgradeHandler({ log, opts, proxy, useForwardedHeaders, userHttpConfig, xo }) {
  return async (req, socket, head) => {
    const { url } = req

    for (const prefix in opts) {
      if (url.startsWith(prefix)) {
        if (isUpdaterProxyPath(url)) {
          try {
            await authenticateUpdater(req, xo, useForwardedHeaders)
          } catch (error) {
            // never log the request headers: they contain the session token
            log.warn('updater proxy: authentication rejected', { error: error.message })
            try {
              socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n')
            } catch (_) {}
            return
          }
        }

        // the updater only listens on loopback: never rewrite its `localhost`
        // target to the address xo-server is bound to
        const { targetUrl, isLocal } = getProxyTargetUrl(
          opts[prefix],
          'ws:',
          isUpdaterProxyPath(prefix) ? { ...userHttpConfig, hostname: undefined } : userHttpConfig
        )

        proxy.ws(req, socket, head, {
          agent: isLocal ? undefined : xo.httpAgent,
          target: targetUrl.href + url.slice(prefix.length),
        })

        return
      }
    }
  }
}
