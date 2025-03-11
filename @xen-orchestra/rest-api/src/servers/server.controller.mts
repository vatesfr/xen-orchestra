import { Example, Get, Path, Query, Request, Response, Route, Security, Tags } from 'tsoa'
import { Request as ExRequest } from 'express'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import type { XoServer } from '@vates/types'

import { notFoundResp, unauthorizedResp, type Unbrand } from '../open-api/common/response.common.mjs'
import { partialServers, server, serverIds } from '../open-api/oa-examples/server.oa-example.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import type { WithHref } from '../helpers/helper.type.mjs'
import { XoController } from '../abstract-classes/xo-controller.mjs'

@Route('servers')
@Security('*')
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('servers')
@provide(ServerController)
export class ServerController extends XoController<XoServer> {
  // --- abstract methods
  _abstractGetObjects(): Promise<XoServer[]> {
    return this.restApi.xoApp.getAllXenServers()
  }
  _abstractGetObject(id: XoServer['id']): Promise<XoServer> {
    return this.restApi.xoApp.getXenServer(id)
  }

  constructor(@inject(RestApi) restApi: RestApi) {
    super(restApi)
  }

  /**
   * @example fields "status,uuid"
   * @example filter "status:/^connected$/"
   * @example limit 42
   */
  @Example(serverIds)
  @Example(partialServers)
  @Get('')
  async getServers(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() filter?: string,
    @Query() limit?: number
  ): Promise<string[] | WithHref<Unbrand<XoServer>>[] | WithHref<Partial<Unbrand<XoServer>>>[]> {
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
}
