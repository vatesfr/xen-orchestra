import swaggerUi from 'swagger-ui-express'
import { Express, Response } from 'express'

import swaggerOpenApiSpec from './open-api/spec/swagger.json' assert { type: 'json' }
import { RegisterRoutes } from './open-api/routes/routes.js'
import { XapiXoObject, XoApp } from './xoApp.type.js'
import { EventEmitter } from 'events'
import * as dashboardService from './dashboard/dashboard.service.js'

class RestApi {
  static instance: RestApi | null = null

  #sseClients: Map<symbol, Response> = new Map()

  ee = new EventEmitter()

  getObjects!: XoApp['getObjects']
  getObject!: XoApp['getObject']
  getServers!: XoApp['getAllXenServers']
  getServer!: XoApp['getXenServer']

  constructor(xoApp: XoApp) {
    if (RestApi.instance !== null) {
      return RestApi.instance
    }

    this.#registerListener(xoApp._objects)

    // wrap these method with permission
    this.getObject = (id, type) => xoApp.getObject(id, type)
    this.getObjects = opts => xoApp.getObjects(opts)
    this.getServers = () => xoApp.getAllXenServers()
    this.getServer = id => xoApp.getXenServer(id)

    RestApi.instance = this
  }

  addSseClient(id: symbol, client: Response) {
    this.#sseClients.set(id, client)
  }

  removeSseClient(id: symbol) {
    this.#sseClients.delete(id)
  }

  #registerListener(event: XoApp['_objects']) {
    // XAPI events
    event.on('remove', data => {
      this.#handleXapiEvent(data, 'remove')
    })
    event.on('add', data => this.#handleXapiEvent(data, 'add'))
    event.on('update', data => this.#handleXapiEvent(data, 'update'))

    // REST API events
    this.ee.on('dashboard:vmsStatus', data => {
      this.#sendData('vmsStatus', 'dashboard', data, 'update')
    })
    this.ee.on('dashboard:poolsStatus', data => {
      this.#sendData('poolsStatus', 'dashboard', data, 'update')
    })
  }

  async #handleXapiEvent(data: Record<string, XapiXoObject | undefined>, operation: 'update' | 'add' | 'remove') {
    const ids = Object.keys(data)
    let vmChanges = false
    let poolChanges = false

    if (operation === 'remove') {
      // on remove operations, we have no way to know the obj type.
      vmChanges = true
      poolChanges = true
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

      this.#sendData(id, obj?.type, obj, operation)
    })

    if (vmChanges) {
      const vmsStatus = dashboardService.getVmsStatus()
      this.ee.emit('dashboard:vmsStatus', vmsStatus)
    }
    if (poolChanges) {
      const poolsStatus = await dashboardService.getPoolsStatus()
      this.ee.emit('dashboard:poolsStatus', poolsStatus)
    }
  }

  #sendData(objId: string, objType: string | undefined, obj: any | undefined, operation: 'update' | 'add' | 'remove') {
    this.#sseClients.forEach(client => {
      client.write(`data: ${JSON.stringify({ id: objId, type: objType, data: obj, operation })}\n\n`)
    })
  }
}

let restApi: RestApi
export const getRestApi = () => restApi

export default function setupRestApi(express: Express, xoApp: XoApp) {
  restApi = new RestApi(xoApp)

  express.use('/rest/v1/api-doc', swaggerUi.serve, swaggerUi.setup(swaggerOpenApiSpec))
  RegisterRoutes(express)
}
