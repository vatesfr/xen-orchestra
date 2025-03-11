import { Example, Get, Path, Query, Request, Response, Route, Security, Tags } from 'tsoa'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import { Request as ExRequest } from 'express'
import type { XoSr } from '@vates/types'

import { notFoundResp, unauthorizedResp, type Unbrand } from '../open-api/common/response.common.mjs'
import { partialSrs, sr, srIds } from '../open-api/oa-examples/sr.oa-example.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import type { WithHref } from '../helpers/helper.type.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'

@Route('srs')
@Security('*')
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('srs')
@provide(SrController)
export class SrController extends XapiXoController<XoSr> {
  constructor(@inject(RestApi) restApi: RestApi) {
    super('SR', restApi)
  }

  /**
   * @example fields "uuid,name_label,allocationStrategy"
   * @example filter "allocationStrategy:thin"
   * @example limit 42
   */
  @Example(srIds)
  @Example(partialSrs)
  @Get('')
  getSrs(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() filter?: string,
    @Query() limit?: number
  ): string[] | WithHref<Unbrand<XoSr>>[] | WithHref<Partial<Unbrand<XoSr>>>[] {
    return this.sendObjects(Object.values(this.getObjects({ filter, limit })), req)
  }

  /**
   * @example id "c4284e12-37c9-7967-b9e8-83ef229c3e03"
   */
  @Example(sr)
  @Get('{id}')
  @Response(notFoundResp.status, notFoundResp.description)
  getSr(@Path() id: string): Unbrand<XoSr> {
    return this.getObject(id as XoSr['id'])
  }
}
