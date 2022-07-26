import { createLogger } from '@xen-orchestra/log'
import { EventListenersManager } from '@vates/event-listeners-manager'
import { pipeline } from 'stream'
import { ServerResponse, request } from 'http'
import assert from 'assert'
import fromCallback from 'promise-toolbox/fromCallback'
import fromEvent from 'promise-toolbox/fromEvent'
import net from 'net'

import { parseBasicAuth } from './_parseBasicAuth.mjs'

const { debug, warn } = createLogger('xo:mixins:HttpProxy')

const IGNORED_HEADERS = new Set([
  // https://datatracker.ietf.org/doc/html/rfc2616#section-13.5.1
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',

  // don't forward original host
  'host',
])

export default class HttpProxy {
  #app

  constructor(app, { httpServer }) {
    // don't setup the proxy if httpServer is not present
    //
    // that can happen when the app is instanciated in another context like xo-server-recover-account
    if (httpServer === undefined) {
      return
    }

    this.#app = app

    const events = new EventListenersManager(httpServer)
    app.config.watch('http.proxy.enabled', (enabled = true) => {
      events.removeAll()
      if (enabled) {
        events.add('connect', this.#handleConnect.bind(this)).add('request', this.#handleRequest.bind(this))
      }
    })
  }

  async #handleAuthentication(req, res, next) {
    const auth = parseBasicAuth(req.headers['proxy-authorization'])

    let authenticated = false

    if (auth !== undefined) {
      const app = this.#app

      if (app.authenticateUser !== undefined) {
        // xo-server
        try {
          const { user } = await app.authenticateUser(auth)
          authenticated = user.permission === 'admin'
        } catch (error) {}
      } else {
        // xo-proxy
        authenticated = (await app.authentication.findProfile(auth)) !== undefined
      }
    }

    if (authenticated) {
      return next()
    }

    // https://datatracker.ietf.org/doc/html/rfc7235#section-3.2
    res.statusCode = '407'
    res.setHeader('proxy-authenticate', 'Basic realm="proxy"')
    return res.end('Proxy Authentication Required')
  }

  // https://nodejs.org/api/http.html#event-connect
  async #handleConnect(req, clientSocket, head) {
    const { url } = req

    debug('CONNECT proxy', { url })

    // https://github.com/TooTallNate/proxy/blob/d677ef31fd4ca9f7e868b34c18b9cb22b0ff69da/proxy.js#L391-L398
    const res = new ServerResponse(req)
    res.assignSocket(clientSocket)

    try {
      await this.#handleAuthentication(req, res, async () => {
        const { port, hostname } = new URL('http://' + req.url)
        const serverSocket = net.connect(port || 80, hostname)

        await fromEvent(serverSocket, 'connect')

        clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n')
        serverSocket.write(head)
        fromCallback(pipeline, clientSocket, serverSocket).catch(warn)
        fromCallback(pipeline, serverSocket, clientSocket).catch(warn)
      })
    } catch (error) {
      warn(error)
      clientSocket.end()
    }
  }

  async #handleRequest(req, res) {
    const { url } = req

    if (url.startsWith('/')) {
      // not a proxy request
      return
    }

    debug('HTTP proxy', { url })

    try {
      assert(url.startsWith('http:'), 'HTTPS should use connect')

      await this.#handleAuthentication(req, res, async () => {
        const { headers } = req
        const pHeaders = {}
        for (const key of Object.keys(headers)) {
          if (!IGNORED_HEADERS.has(key)) {
            pHeaders[key] = headers[key]
          }
        }

        const pReq = request(url, { headers: pHeaders, method: req.method })
        fromCallback(pipeline, req, pReq).catch(warn)

        const pRes = await fromEvent(pReq, 'response')
        res.writeHead(pRes.statusCode, pRes.statusMessage, pRes.headers)
        await fromCallback(pipeline, pRes, res)
      })
    } catch (error) {
      res.statusCode = 500
      res.end('Internal Server Error')
      warn(error)
    }
  }
}
