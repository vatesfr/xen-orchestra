import swaggerUi from 'swagger-ui-express'
import { Express, NextFunction, Request, Response } from 'express'

import swaggerOpenApiSpec from './open-api/spec/swagger.json' assert { type: 'json' }
import { RegisterRoutes } from './open-api/routes/routes.js'
import { XapiXoObject, XoApp } from './xoApp.type.js'
import { EventEmitter } from 'events'
import DashboardService from './dashboard/dashboard.service.js'
import { iocContainer } from './ioc/ioc.js'
import { errorHandler } from './middleware/error.middleware.js'
import fs from 'node:fs/promises'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

class RestApi {
  #sseClients: Map<symbol, Response> = new Map()
  #express

  ee = new EventEmitter()

  authenticateUser
  getObject
  getObjects
  getServers: XoApp['getAllXenServers']
  getServer: XoApp['getXenServer']
  getXapiObject: XoApp['getXapiObject']
  getObjectsByType

  constructor(xoApp: XoApp, express: Express) {
    console.log('INITIALIZE')
    if (restApi !== undefined) {
      throw new Error('RestApi is a singleton')
    }

    this.#express = express

    // existing xo methods
    this.authenticateUser = xoApp.authenticateUser.bind(xoApp)
    this.getObject = xoApp.getObject.bind(xoApp)
    this.getObjects = xoApp.getObjects.bind(xoApp)
    this.getServers = () => xoApp.getAllXenServers()
    this.getXapiObject = (idOrObj, type) => xoApp.getXapiObject(idOrObj, type)
    this.getServer = id => xoApp.getXenServer(id)

    // helpers
    this.getObjectsByType = <T extends keyof typeof xoApp.objects.indexes.type>(type: T) =>
      xoApp.objects.indexes.type[type]

    // @ts-ignore
    this.#registerListener(xoApp.objects.allIndexes.type)
  }

  addSseClient(id: symbol, client: Response) {
    this.#sseClients.set(id, client)
  }

  removeSseClient(id: symbol) {
    this.#sseClients.delete(id)
  }

  sendData(objId: string, objType: string | undefined, obj: any | undefined, operation: 'update' | 'add' | 'remove') {
    this.#sseClients.forEach(client => {
      client.write(`data: ${JSON.stringify({ id: objId, type: objType, data: obj, operation })}\n\n`)
    })
  }

  async registerRoute(
    endpoint: string,
    cb: (req: Request, res: Response, next: NextFunction) => any,
    openapiSpec: Object,
    httpMethod: 'get' | 'post' | 'put' | 'patch' | 'delete' = 'get'
  ) {
    if (endpoint[0] !== '/') {
      endpoint = '/' + endpoint
    }
    this.#express[httpMethod](`/rest/v1${endpoint}`, cb)
    const currentConfig = JSON.parse(
      await fs.readFile(`${__dirname}/open-api/spec/swagger-tmp.json`, { encoding: 'utf-8' })
    )
    currentConfig.paths[endpoint] = openapiSpec
    await fs.writeFile(`${__dirname}/open-api/spec/swagger-tmp.json`, JSON.stringify(currentConfig), {
      encoding: 'utf-8',
    })
  }

  #registerListener(obj: EventEmitter) {
    // XO events
    obj.on('remove', (type, data) => this.#handleXapiEvent(type, data, 'remove'))
    obj.on('add', (type, data) => this.#handleXapiEvent(type, data, 'add'))
    obj.on('update', (type, data) => this.#handleXapiEvent(type, data, 'update'))
  }

  async #handleXapiEvent(type: string, data: XapiXoObject, operation: 'update' | 'add' | 'remove') {
    if ((data as any).type === 'message') {
      // just to avoid client to be spammed by message for the moment
      return
    }

    this.ee.emit(type.toLowerCase(), data, operation)
    this.sendData(data.id, data.type, data, operation)
  }
}

let restApi: RestApi
export const getRestApi = () => {
  if (restApi === undefined) {
    throw new Error('The REST API is not instantiated')
  }
  return restApi
}

export default async function setupRestApi(express: Express, xoApp: XoApp) {
  restApi = new RestApi(xoApp, express)

  await fs.copyFile(`${__dirname}/open-api/spec/swagger.json`, `${__dirname}/open-api/spec/swagger-tmp.json`)

  express.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*') // TODO: remove this. Only used for test
    next()
  })

  express.use('/rest/v1/api-doc', swaggerUi.serve, async (req, res, next) => {
    const spec = JSON.parse(await fs.readFile(`${__dirname}/open-api/spec/swagger-tmp.json`, { encoding: 'utf-8' }))
    swaggerUi.setup(spec)(req, res, next)
  })
  RegisterRoutes(express)

  express.use(errorHandler)

  // in order to create the instance of the service (and start to listen for dashboard changes)
  iocContainer.get(DashboardService)
}
