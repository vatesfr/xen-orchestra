import { Example, Get, Path, Query, Request, Response, Route, Security, Tags } from 'tsoa'
import type { Request as ExRequest } from 'express'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import type { XoHost } from '@vates/types'

import { host, hostIds, partialHosts } from '../open-api/oa-examples/host.oa-example.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import type { Unbrand, WithHref } from '../helpers/helper.type.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'

@Route('hosts')
@Security('*')
@Response(401, 'Authentication required')
@Tags('hosts')
@provide(HostController)
export class HostController extends XapiXoController<XoHost> {
  constructor(@inject(RestApi) restApi: RestApi) {
    super('host', restApi)
  }

  /**
   * @example fields "id,name_label,productBrand"
   * @example filter "productBrand:XCP-ng"
   * @example limit 42
   */
  @Example(hostIds)
  @Example(partialHosts)
  @Get('')
  getHosts(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() filter?: string,
    @Query() limit?: number
  ): string[] | WithHref<Unbrand<XoHost>>[] | WithHref<Partial<Unbrand<XoHost>>>[] {
    return this.sendObjects(Object.values(this.getObjects({ filter, limit })), req)
  }

  /**
   * @example id "b61a5c92-700e-4966-a13b-00633f03eea8"
   */
  @Example(host)
  @Get('{id}')
  @Response(404, 'Host not found')
  getHost(@Path() id: string): Unbrand<XoHost> {
    return this.getObject(id as XoHost['id'])
  }
}
