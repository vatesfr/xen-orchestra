import {
  Body,
  Example,
  Get,
  Middlewares,
  Path,
  Post,
  Query,
  Request,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from 'tsoa'
import { type Request as ExRequest, json } from 'express'
import { provide } from 'inversify-binding-decorators'
import type { XoServer } from '@vates/types'

import type { InsertableXoServer } from './server.type.mjs'

import {
  asynchronousActionResp,
  createdResp,
  invalidParameters,
  noContentResp,
  notFoundResp,
  resourceAlreadyExists,
  unauthorizedResp,
  type Unbrand,
} from '../open-api/common/response.common.mjs'
import { partialServers, server, serverId, serverIds } from '../open-api/oa-examples/server.oa-example.mjs'
import { taskLocation } from '../open-api/oa-examples/task.oa-example.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'
import { XoController } from '../abstract-classes/xo-controller.mjs'

@Route('servers')
@Security('*')
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('servers')
@provide(ServerController)
export class ServerController extends XoController<XoServer> {
  // --- abstract methods
  getAllCollectionObjects(): Promise<XoServer[]> {
    return this.restApi.xoApp.getAllXenServers()
  }
  getCollectionObject(id: XoServer['id']): Promise<XoServer> {
    return this.restApi.xoApp.getXenServer(id)
  }

  /**
   * @example fields "status,id"
   * @example filter "status:/^connected$/"
   * @example limit 42
   */
  @Example(serverIds)
  @Example(partialServers)
  @Get('')
  async getServers(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): Promise<SendObjects<Partial<Unbrand<XoServer>>>> {
    return this.sendObjects(Object.values(await this.getObjects({ filter, limit })), req)
  }

  /**
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   */
  @Example(server)
  @Get('{id}')
  @Response(notFoundResp.status, notFoundResp.description)
  getServer(@Path() id: string): Promise<Unbrand<XoServer>> {
    return this.getObject(id as XoServer['id'])
  }

  /**
   * @example body {
   *   "allowUnauthorized": true,
   *   "host": "192.168.1.10",
   *   "label": "Example server",
   *   "username": "root",
   *   "password": "awes0meP4ssword"
   * }
   */
  @Example(serverId)
  @Post('')
  @Middlewares(json())
  @SuccessResponse(createdResp.status, createdResp.description)
  @Response(resourceAlreadyExists.status, resourceAlreadyExists.description)
  @Response(invalidParameters.status, invalidParameters.description)
  async addServer(@Body() body: InsertableXoServer): Promise<{ id: string }> {
    const server = await this.restApi.xoApp.registerXenServer(body)
    return { id: server.id }
  }

  /**
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   */
  @Example(taskLocation)
  @Post('{id}/actions/connect')
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description, asynchronousActionResp.produce)
  @Response(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(409, 'The server is already connected')
  connectServer(@Path() id: string, @Query() sync?: boolean): Promise<void | string> {
    const serverId = id as XoServer['id']
    const action = async () => {
      await this.restApi.xoApp.connectXenServer(serverId)
    }

    return this.createAction<void>(action, {
      statusCode: noContentResp.status,
      sync,
      taskProperties: { name: 'connect server', objectId: serverId },
    })
  }

  /**
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   */
  @Example(taskLocation)
  @Post('{id}/actions/disconnect')
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description, asynchronousActionResp.produce)
  @Response(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(409, 'The server is already disconnected')
  disconnectServer(@Path() id: string, @Query() sync?: boolean): Promise<void | string> {
    const serverId = id as XoServer['id']
    const action = async () => {
      await this.restApi.xoApp.disconnectXenServer(serverId)
    }

    return this.createAction<void>(action, {
      statusCode: noContentResp.status,
      sync,
      taskProperties: { name: 'disconnect server', objectId: serverId },
    })
  }
}
