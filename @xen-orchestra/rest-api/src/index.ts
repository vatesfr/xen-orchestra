import swaggerUi from 'swagger-ui-express'
import { Express, Response } from 'express'

import swaggerOpenApiSpec from './open-api/spec/swagger.json' assert { type: 'json' }
import { RegisterRoutes } from './open-api/routes/routes.js'
import { XapiXoObject, XoApp } from './xoApp.type.js'
import { EventEmitter } from 'events'
import DashboardService from './dashboard/dashboard.service.js'
import { iocContainer } from './ioc/ioc.js'
import { XoServer } from './servers/server.type.js'

class RestApi {
  #sseClients: Map<symbol, Response> = new Map()

  ee = new EventEmitter()

  authenticateUser
  getObject
  getObjects
  getServers
  getServer
  getObjectsByType

  constructor(xoApp: XoApp) {
    if (restApi !== undefined) {
      throw new Error('RestApi is a singleton')
    }

    // existing xo methods
    this.authenticateUser = xoApp.authenticateUser.bind(xoApp)
    this.getObject = xoApp.getObject.bind(xoApp)
    this.getObjects = xoApp.getObjects.bind(xoApp)
    this.getServers = () => xoApp.getAllXenServers()
    this.getServer = (id: XoServer['id']) => xoApp.getXenServer(id)

    // helpers
    this.getObjectsByType = <T extends keyof typeof xoApp.objects.indexes.type>(type: T) =>
      xoApp.objects.indexes.type[type]

    //
    this.#registerListener(xoApp.objects)
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

  #registerListener(obj: XoApp['objects']) {
    // XO events
    obj.on('remove', data => {
      this.#handleXapiEvent(data, 'remove')
    })
    obj.on('add', data => this.#handleXapiEvent(data, 'add'))
    obj.on('update', data => this.#handleXapiEvent(data, 'update'))
  }

  async #handleXapiEvent(data: Record<string, XapiXoObject | undefined>, operation: 'update' | 'add' | 'remove') {
    const ids = Object.keys(data)
    let vmChanges = false
    let poolChanges = false
    let hostChanges = false

    if (operation === 'remove') {
      // on remove operations, we have no way to know the obj type.
      vmChanges = true
      poolChanges = true
      hostChanges = true
    }

    ids.forEach(id => {
      const obj = data[id]
      // just to avoid client to be spammed by message for the moment
      if ((obj as any)?.type === 'message') {
        return
      }

      if (obj?.type === 'VM') {
        vmChanges = true
      }
      if (obj?.type === 'pool') {
        poolChanges = true
      }

      this.sendData(id, obj?.type, obj, operation)
    })

    if (vmChanges) {
      this.ee.emit('vm')
    }
    if (poolChanges) {
      this.ee.emit('pool')
    }
    if (hostChanges) {
      this.ee.emit('host')
    }
    // if we are able to got the object type when remove operation is emit, simply do: `this.ee.emit(obj.type)`
  }
}

let restApi: RestApi
export const getRestApi = () => restApi

export default function setupRestApi(express: Express, xoApp: XoApp) {
  restApi = new RestApi(xoApp)

  express.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*') // TODO: remove this. Only used for test
    next()
  })
  express.use('/rest/v1/api-doc', swaggerUi.serve, swaggerUi.setup(swaggerOpenApiSpec))
  RegisterRoutes(express)

  // in order to create the instance of the service (and start to listen for dashboard changes)
  iocContainer.get(DashboardService)
}
