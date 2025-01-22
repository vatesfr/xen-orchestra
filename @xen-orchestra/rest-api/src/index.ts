import swaggerUi from 'swagger-ui-express'
import { Express, Response } from 'express'

import swaggerOpenApiSpec from './open-api/spec/swagger.json' assert { type: 'json' }
import { RegisterRoutes } from './open-api/routes/routes.js'
import { XoApp, XoObject } from './xoApp.type.js'

class RestApi {
  static instance: RestApi | null = null

  #api!: Express
  #prefix = '/rest/v1'
  #sseClients: Map<symbol, Response> = new Map()

  getObjects!: XoApp['getObjects']
  getObject!: XoApp['getObject']
  getServers!: XoApp['getAllXenServers']
  getServer!: XoApp['getXenServer']

  constructor(xoApp: XoApp, express: Express) {
    if (RestApi.instance !== null) {
      return RestApi.instance
    }

    this.#registerListener(xoApp._objects)

    this.#api = express

    // wrap these method with permission
    this.getObject = (id, type) => xoApp.getObject(id, type)
    this.getObjects = opts => xoApp.getObjects(opts)
    this.getServers = () => xoApp.getAllXenServers()
    this.getServer = id => xoApp.getXenServer(id)

    RestApi.instance = this
  }

  #registerListener(event: XoApp['_objects']) {
    event.on('remove', data => this.sendData(data, 'remove'))
    event.on('add', data => this.sendData(data, 'add'))
    event.on('update', data => this.sendData(data, 'update'))
  }

  addSseClient(id: symbol, client: Response) {
    this.#sseClients.set(id, client)
  }

  removeSseClient(id: symbol) {
    this.#sseClients.delete(id)
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

let restApi: RestApi
export const getRestApi = () => restApi

export default function setupRestApi(express: Express, xoApp: XoApp) {
  express.use('/rest/v1/api-doc', swaggerUi.serve, swaggerUi.setup(swaggerOpenApiSpec))
  RegisterRoutes(express)

  restApi = new RestApi(xoApp, express)
}
