// @flow

import type EventEmitter from 'events'
import type {
  IncomingMessage,
  Server,
  ServerResponse,
} from 'http'

import createLogger from '@xen-orchestra/log'
import generateToken from 'generate-token'
import { fromCallback } from 'promise-toolbox'
import { once } from 'lodash'

const HTTP_REQUEST_VALIDITY = 1e3 * 60 * 60
const { warn } = createLogger('web-server')

type Handler = (IncomingMessage, ServerResponse, any) => void
type HandlerInfo = {|
  data: any,
  handler: Handler,
  method: ?string,
  once: boolean,
  path: string,
  unregister: () => void
|}

type HandlerInfoMap = { [url: string]: HandlerInfo }

export default class httpServer {
  _handlers: HandlerInfoMap

  constructor (app: EventEmitter, { httpServer }: { httpServer: Server }) {
    const openConnections = new Set()
    httpServer.on('connection', connection => {
      openConnections.add(connection)
      connection.once('close', () => {
        openConnections.delete(connection)
      })
    })
    app.on('stop', () => {
      const timeout = setTimeout(() => {
        openConnections.forEach(connection => {
          connection.end()
        })
      }, 5e3).unref()

      return fromCallback(cb => httpServer.close(cb)).then(() => {
        clearTimeout(timeout)
      })
    })

    const handlers = this._handlers = Object.create(null)
    httpServer.on('request', (req, res) => {
      const handler = handlers[req.url]
      if (
        handler !== undefined &&
        (handler.method !== undefined || handler.method === req.method)
      ) {
        if (handler.once) {
          handler.unregister()
        }

        try {
          handler.handler.call(app, req, res, handler.data)
        } catch (error) {
          warn('handler error', { error })
          if (!res.headersSent) {
            res.writeHead(500)
          }
          res.end()
        }
        return
      }

      res.writeHead(404)
      res.end(`Page not found: ${req.url}`)
    })
  }

  registerHttpHandler (
    handler: Handler,
    { data, method, once: once_ = false, path, ttl }
  ) {
    const handlers = this._handlers

    if (path in handlers) {
      throw new Error(`there is already an HTTP handler for ${path}`)
    }

    const unregister = once(() => {
      delete handlers[path]
    })

    handlers[path] = {
      data,
      handler,
      method: method && method.toUpperCase(),
      once: once_,
      path,
      unregister,
    }

    if (ttl !== undefined) {
      setTimeout(unregister, ttl)
    }

    return unregister
  }

  registerHttpRequest (
    handler: Handler,
    { data, path, method = 'GET', suffix }
  ) {
    return generateToken().then(token => {
      let path = `/${token}`
      if (suffix) {
        path += `/${encodeURI(token)}`
      }

      this.registerHttpHandler(handler, {
        data,
        method,
        once: true,
        path,
        ttl: HTTP_REQUEST_VALIDITY,
      })

      return path
    })
  }
}
