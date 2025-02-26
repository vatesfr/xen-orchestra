import { Get, Path, Query, Request, Response, Route, Security, Tags } from 'tsoa'
import { Request as ExRequest } from 'express'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import type { XoServer } from '@vates/types'

import { RestApi } from '../rest-api/rest-api.mjs'
import type { Unbrand, WithHref } from '../helpers/helper.type.mjs'
import { XoController } from '../abstract-classes/xo-controller.mjs'

@Route('servers')
@Security('*')
@Response(401)
@Tags('servers')
@provide(ServerController)
export class ServerController extends XoController<XoServer> {
  // --- abstract methods
  _abstractGetObjects(): Promise<XoServer[]> {
    return this.restApi.getAllXenServers()
  }
  _abstractGetObject(id: XoServer['id']): Promise<XoServer> {
    return this.restApi.getXenServer(id)
  }

  constructor(@inject(RestApi) restApi: RestApi) {
    super(restApi)
  }

  /**
   * @example fields "status,uuid"
   * @example filter "status:/^connected$/"
   * @example limit 42
   */
  @Get('')
  async getServers(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() filter?: string,
    @Query() limit?: number
  ): Promise<string[] | WithHref<Unbrand<XoServer>>[] | WithHref<Partial<Unbrand<XoServer>>>[]> {
    const servers = Object.values(await this.getObjects({ filter, limit }))
    return this.sendObjects(servers, req)
  }

  /**
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   */
  @Get('{id}')
  getServer(@Path() id: string) {
    return this.getObject(id as XoServer['id'])
  }
}
