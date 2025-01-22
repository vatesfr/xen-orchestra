import swaggerUi from 'swagger-ui-express'
import { Express, Request, Response } from 'express'

import swaggerOpenApiSpec from './open-api/spec/swagger.json' assert { type: 'json' }
import { RegisterRoutes } from './open-api/routes/routes.js'
import { XoApp, XoObject } from './xoApp.type.js'

export interface ExtendedRequest extends Request {
  xoApp: XoApp
}

export default class RestApi {
  #api: Express
  #prefix = '/rest/v1'
  #sseClients: Map<symbol, Response> = new Map()

  constructor(xoApp: XoApp, express: Express) {
    express.use(this.#prefix, (req, _res, next) => {
      xoApp.addSseClient = (id, client) => this.#sseClients.set(id, client)
      xoApp.removeSseClient = id => this.#sseClients.delete(id)
      ;(req as ExtendedRequest).xoApp = xoApp
      next()
    })

    const objects = xoApp._objects
    objects.on('remove', data => this.sendData(data, 'remove'))
    objects.on('add', data => this.sendData(data, 'add'))
    objects.on('update', data => this.sendData(data, 'update'))

    this.#api = express
  }

  registerOpenApi() {
    this.#api.use(`${this.#prefix}/api-doc`, swaggerUi.serve, swaggerUi.setup(swaggerOpenApiSpec))
  }

  registerRoutes() {
    RegisterRoutes(this.#api)
  }

  sendData(data: Record<string, XoObject | undefined>, operation: 'update' | 'add' | 'remove') {
    this.#sseClients.forEach(client => {
      client.write(`data: ${JSON.stringify({ operation, data })}\n\n`)
    })
  }
}
