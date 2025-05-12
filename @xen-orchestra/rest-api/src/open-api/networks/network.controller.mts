import { Example, Get, Path, Query, Response, Request, Route, Security, Tags } from 'tsoa'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import { Request as ExRequest } from 'express'
import type { XoNetwork } from '@vates/types'

import { network, networkIds, partialNetworks } from '../oa-examples/network.oa-example.mjs'
import { notFoundResp, unauthorizedResp, type Unbrand } from '../common/response.common.mjs'
import { RestApi } from '../../rest-api/rest-api.mjs'
import type { WithHref } from '../../helpers/helper.type.mjs'
import { XapiXoController } from '../../abstract-classes/xapi-xo-controller.mjs'

@Route('networks')
@Security('*')
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('networks')
@provide(NetworkController)
export class NetworkController extends XapiXoController<XoNetwork> {
  constructor(@inject(RestApi) restApi: RestApi) {
    super('network', restApi)
  }

  /**
   * @example fields "nbd,name_label,id"
   * @example filter "nbd?"
   * @example limit 42
   */
  @Example(networkIds)
  @Example(partialNetworks)
  @Get('')
  getNetworks(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() filter?: string,
    @Query() limit?: number
  ): string[] | WithHref<Partial<Unbrand<XoNetwork>>>[] {
    return this.sendObjects(Object.values(this.getObjects({ filter, limit })), req)
  }

  /**
   * @example id "9fe12ca3-d75d-cfb0-492e-cfd2bc6c568f"
   */
  @Example(network)
  @Get('{id}')
  @Response(notFoundResp.status, notFoundResp.description)
  getNetwork(@Path() id: string): Unbrand<XoNetwork> {
    return this.getObject(id as XoNetwork['id'])
  }
}
