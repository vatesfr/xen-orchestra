import { Example, Get, Path, Query, Request, Response, Route, Security, Tags } from 'tsoa'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import { Request as ExRequest } from 'express'
import type { XoVdi } from '@vates/types'

import { notFoundResp, unauthorizedResp, type Unbrand } from '../open-api/common/response.common.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import type { WithHref } from '../helpers/helper.type.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'
import { partialVdis, vdi, vdiIds } from '../open-api/oa-examples/vdi.oa-example.mjs'

@Route('vdis')
@Security('*')
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('vdis')
@provide(VdiController)
export class VdiController extends XapiXoController<XoVdi> {
  constructor(@inject(RestApi) restApi: RestApi) {
    super('VDI', restApi)
  }

  /**
   * @example fields "*"
   * @example filter "snapshots:length:>2"
   * @example limit 42
   */
  @Example(vdiIds)
  @Example(partialVdis)
  @Get('')
  getVdis(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() filter?: string,
    @Query() limit?: number
  ): string[] | WithHref<Partial<Unbrand<XoVdi>>>[] {
    return this.sendObjects(Object.values(this.getObjects({ filter, limit })), req)
  }

  /**
   * @example id "c77f9955-c1d2-4b39-aa1c-73cdb2dacb7e"
   */
  @Example(vdi)
  @Get('{id}')
  @Response(notFoundResp.status, notFoundResp.description)
  getVdi(@Path() id: string): Unbrand<XoVdi> {
    return this.getObject(id as XoVdi['id'])
  }
}
