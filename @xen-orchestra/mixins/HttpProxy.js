'use strict'

const { debug, warn } = require('@xen-orchestra/log').createLogger('xo:mixins:HttpProxy')
const { EventListenersManager } = require('@vates/event-listeners-manager')
const { pipeline } = require('stream')
const { ServerResponse, request } = require('http')
const assert = require('assert')
const fromCallback = require('promise-toolbox/fromCallback')
const fromEvent = require('promise-toolbox/fromEvent')
const net = require('net')

const { parseBasicAuth } = require('./_parseBasicAuth.js')

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

// https://nodejs.org/api/http.html#event-connect
module.exports = class HttpProxy {
  #app

  constructor(app, { httpServer }) {
    this.#app = app

    const events = new EventListenersManager(httpServer)
    app.config.watch('http.proxy.enabled', (enabled = false) => {
      events.removeAll()
      if (enabled) {
        events.add('connect', this.#handleConnect.bind(this)).add('request', this.#handleRequest.bind(this))
      }
    })
  }

  async #handleAuthentication(req, res, next) {
    const auth = parseBasicAuth(req.headers['proxy-authorization'])

    const app = this.#app
    if (
      auth === undefined ||
      !(await (app.authenticateUser !== undefined
        ? app.authenticateUser(auth) // xo-server
        : app.authentication.findProfile(auth))) // xo-proxy
    ) {
      // https://datatracker.ietf.org/doc/html/rfc7235#section-3.2
      res.statusCode = '407'
      res.setHeader('proxy-authenticate', 'Basic realm="proxy"')
      return res.end('Proxy Authentication Required')
    }

    return next()
  }

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
