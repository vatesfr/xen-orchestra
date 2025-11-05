import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import type { Request as ExRequest } from 'express'
import { Route, Security, Request, Response, Get, Query, Path, Tags, Example } from 'tsoa'
import type { XoPbd } from '@vates/types'

import { badRequestResp, unauthorizedResp, Unbrand } from '../open-api/common/response.common.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'
import { partialPbds, pbd, pbdIds } from '../open-api/oa-examples/pbd.oa-example.mjs'

@Route('pbds')
@Security('*')
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Response(badRequestResp.status, badRequestResp.description)
@Tags('pbds')
@provide(PbdController)
export class PbdController extends XapiXoController<XoPbd> {
  constructor(@inject(RestApi) restApi: RestApi) {
    super('PBD', restApi)
  }

  /**
   * @example fields "attached,id,device_config"
   * @example filter "attached?"
   * @example limit 42
   */
  @Example(pbdIds)
  @Example(partialPbds)
  @Get('')
  getPbds(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoPbd>>> {
    return this.sendObjects(Object.values(this.getObjects({ filter, limit })), req)
  }

  /**
   * @example id "16b2a60f-7c4d-f45f-7c7a-963b06fc587d"
   */
  @Example(pbd)
  @Get('{id}')
  getPbd(@Path() id: string): Unbrand<XoPbd> {
    return this.getObject(id as XoPbd['id'])
  }
}
