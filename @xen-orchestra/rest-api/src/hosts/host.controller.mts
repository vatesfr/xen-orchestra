import { Example, Get, Path, Query, Request, Response, Route, Security, Tags } from 'tsoa'
import type { Request as ExRequest } from 'express'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import type { XapiHostStats, XapiStatsGranularity, XoHost } from '@vates/types'

import { host, hostIds, hostStats, partialHosts } from '../open-api/oa-examples/host.oa-example.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import type { WithHref } from '../helpers/helper.type.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'
import {
  internalServerErrorResp,
  notFoundResp,
  unauthorizedResp,
  type Unbrand,
} from '../open-api/common/response.common.mjs'

@Route('hosts')
@Security('*')
@Response(unauthorizedResp.status, unauthorizedResp.description)
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
  @Response(notFoundResp.status, notFoundResp.description)
  getHost(@Path() id: string): Unbrand<XoHost> {
    return this.getObject(id as XoHost['id'])
  }

  /**
   * Host must be running
   * @example id "b61a5c92-700e-4966-a13b-00633f03eea8"
   */
  @Example(hostStats)
  @Get('{id}/stats')
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(422, 'Invalid granularity')
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  getHostStats(@Path() id: string, @Query() granularity?: XapiStatsGranularity): Promise<XapiHostStats> {
    return this.restApi.xoApp.getXapiHostStats(id as XoHost['id'], granularity)
  }
}
