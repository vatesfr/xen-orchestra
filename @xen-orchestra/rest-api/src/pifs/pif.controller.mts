import { Example, Get, Path, Query, Request, Response, Route, Security, Tags } from 'tsoa'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import type { Request as ExRequest } from 'express'
import type { XoPif } from '@vates/types'

import { notFoundResp, unauthorizedResp, type Unbrand } from '../open-api/common/response.common.mjs'
import { partialPifs, pif, pifIds } from '../open-api/oa-examples/pif.oa-example.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'

type UnbrandedXoPif = Unbrand<XoPif>

@Route('pifs')
@Security('*')
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('pifs')
@provide(PifController)
export class PifController extends XapiXoController<XoPif> {
  constructor(@inject(RestApi) restApi: RestApi) {
    super('PIF', restApi)
  }

  /**
   * @example fields "attached,device,deviceName,id"
   * @example filter "attached?"
   * @example limit 42
   */
  @Example(pifIds)
  @Example(partialPifs)
  @Get('')
  getPifs(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<UnbrandedXoPif>> {
    return this.sendObjects(Object.values(this.getObjects({ filter, limit })), req)
  }

  /**
   * @example id "d9e42451-3794-089f-de81-4ee0e6137bee"
   */
  @Example(pif)
  @Get('{id}')
  @Response(notFoundResp.status, notFoundResp.description)
  getPif(@Path() id: string): UnbrandedXoPif {
    return this.getObject(id as XoPif['id'])
  }
}
