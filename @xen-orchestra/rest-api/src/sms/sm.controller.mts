import { Example, Get, Path, Query, Request, Response, Route, Security, Tags } from 'tsoa'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import { Request as ExRequest } from 'express'
import type { XoSm } from '@vates/types'

import { notFoundResp, unauthorizedResp, type Unbrand } from '../open-api/common/response.common.mjs'
import { partialSms, sm, smIds } from '../open-api/oa-examples/sm.oa-example.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'

@Route('sms')
@Security('*')
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('sms')
@provide(SmController)
export class SmController extends XapiXoController<XoSm> {
  constructor(@inject(RestApi) restApi: RestApi) {
    super('SM', restApi)
  }

  /**
   * @example fields "uuid,name_label,allocationStrategy"
   * @example filter "allocationStrategy:thin"
   * @example limit 42
   */
  @Example(smIds)
  @Example(partialSms)
  @Get('')
  getSms(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoSm>>> {
    return this.sendObjects(Object.values(this.getObjects({ filter, limit })), req)
  }

  /**
   * @example id "c4284e12-37c9-7967-b9e8-83ef229c3e03"
   */
  @Example(sm)
  @Get('{id}')
  @Response(notFoundResp.status, notFoundResp.description)
  getSm(@Path() id: string): Unbrand<XoSm> {
    return this.getObject(id as XoSm['id'])
  }
}
