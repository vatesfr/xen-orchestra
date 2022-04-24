'use strict'

const { debug, warn } = require('@xen-orchestra/log').createLogger('xo:mixins:HttpProxy')
const { pipeline } = require('stream')
const { ServerResponse, request } = require('http')
const assert = require('assert')
const fromCallback = require('promise-toolbox/fromCallback')
const net = require('net')

const { parseBasicAuth } = require('./_parseBasicAuth.js')
const fromEvent = require('promise-toolbox/fromEvent')

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

    httpServer.on('connect', this.#handleConnect.bind(this)).on('request', this.#handleRequest.bind(this))
  }

  async #handleAuthentication(req, res, next) {
    const authenticationToken = this.#app.config.getOptional('http.proxies.authenticationToken')

    if (authenticationToken !== undefined) {
      const auth = parseBasicAuth(req.headers['proxy-authorization'])

      // https://datatracker.ietf.org/doc/html/rfc7235#section-3.2
      if (auth === undefined || !(auth.user === authenticationToken && auth.password === '')) {
        res.statusCode = '407'
        res.setHeader('proxy-authenticate', 'Basic realm="proxy"')
        return res.end('Proxy Authentication Required')
      }
    }
    return next()
  }

  async #handleConnect(req, clientSocket, head) {
    const { url } = req

    debug('CONNECT proxy', { url })

    // https://github.com/TooTallNate/proxy/blob/d677ef31fd4ca9f7e868b34c18b9cb22b0ff69da/proxy.js#L391-L398
    const res = new ServerResponse(req)
    res.assignSocket(clientSocket)

    this.#handleAuthentication(req, res, () => {
      const { port, hostname } = new URL('http://' + req.url)
      const serverSocket = net.connect(port || 80, hostname, function () {
        clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n')
        serverSocket.write(head)
        fromCallback(pipeline, clientSocket, serverSocket).catch(warn)
        fromCallback(pipeline, serverSocket, clientSocket).catch(warn)
      })
    }).catch(warn)
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
