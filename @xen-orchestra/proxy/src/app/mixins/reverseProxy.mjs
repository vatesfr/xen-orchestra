import { urlToHttpOptions } from 'url'
import proxy from 'http2-proxy'

function removeSlash(str) {
  return str.replace(/^\/|\/$/g, '')
}

function mergeUrl(relative, base) {
  const res = new URL(base)
  const relativeUrl = new URL(relative, base)
  res.pathname = relativeUrl.pathname
  relativeUrl.searchParams.forEach((value, name) => {
    // we do not allow to modify params already specified by config
    if (!res.searchParams.has(name)) {
      res.searchParams.append(name, value)
    }
  })
  res.hash = relativeUrl.hash.length > 0 ? relativeUrl.hash : res.hash
  return res
}

export function backendToLocalPath(basePath, target, backendUrl) {
  // keep redirect url relative to local server
  const localPath = `${basePath}/${backendUrl.pathname.substring(target.pathname.length)}${backendUrl.search}${
    backendUrl.hash
  }`
  return localPath
}

export function localToBackendUrl(basePath, target, localPath) {
  let localPathWithoutBase = removeSlash(localPath).substring(basePath.length)
  localPathWithoutBase = './' + removeSlash(localPathWithoutBase)
  const url = mergeUrl(localPathWithoutBase, target)
  return url
}

export default class ReverseProxy {
  constructor(app, { httpServer }) {
    this._app = app
    httpServer.on('request', (req, res) => this._proxy(req, res))
    httpServer.on('upgrade', (req, socket, head) => this._upgrade(req, socket, head))
  }

  _getConfigFromRequest(req) {
    const proxies = this._app.config.get('reverseProxies')
    for (const path of Object.keys(proxies).sort((a, b) => b.length - a.length)) {
      const config = proxies[path]
      const fullPath = '/proxy/v1/' + removeSlash(path)
      if (req.url.startsWith(fullPath + '/')) {
        if (typeof config === 'string') {
          return {
            path: fullPath,
            target: config,
            options: {},
          }
        }

        const { target, ...options } = config
        return {
          path: fullPath,
          target,
          options,
        }
      }
    }
  }

  _proxy(req, res) {
    const config = this._getConfigFromRequest(req)

    if (config === undefined) {
      res.writeHead(404)
      res.end('404')
      return
    }

    const url = new URL(config.target)
    const targetUrl = localToBackendUrl(config.path, url, req.originalUrl || req.url)
    proxy.web(req, res, {
      ...urlToHttpOptions(targetUrl),
      ...config.options,
      onReq: (req, { headers }) => {
        headers['x-forwarded-for'] = req.socket.remoteAddress
        headers['x-forwarded-proto'] = req.socket.encrypted ? 'https' : 'http'
        if (req.headers.host !== undefined) {
          headers['x-forwarded-host'] = req.headers.host
        }
      },
      onRes: (req, res, proxyRes) => {
        // rewrite redirect to pass through this proxy
        if (proxyRes.statusCode === 301 || proxyRes.statusCode === 302) {
          // handle relative/ absolute location
          const redirectTargetLocation = new URL(proxyRes.headers.location, url)

          // this proxy should only allow communication between known hosts. Don't open it too much
          if (redirectTargetLocation.hostname !== url.hostname || redirectTargetLocation.protocol !== url.protocol) {
            throw new Error(`Can't redirect from ${url.hostname} to ${redirectTargetLocation.hostname} `)
          }
          res.writeHead(proxyRes.statusCode, {
            ...proxyRes.headers,
            location: backendToLocalPath(config.path, url, redirectTargetLocation),
          })
          res.end()
          return
        }
        // pass through the answer of the remote server
        res.writeHead(proxyRes.statusCode, {
          ...proxyRes.headers,
        })
        // pass through content
        proxyRes.pipe(res)
      },
    })
  }

  _upgrade(req, socket, head) {
    const config = this._getConfigFromRequest(req)
    if (config === undefined) {
      return
    }

    const { path, target, options } = config
    const targetUrl = localToBackendUrl(path, target, req.originalUrl || req.url)
    proxy.ws(req, socket, head, {
      ...urlToHttpOptions(targetUrl),
      ...options,
    })
  }
}
