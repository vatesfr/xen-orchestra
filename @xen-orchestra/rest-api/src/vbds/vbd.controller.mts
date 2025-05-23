import { Example, Get, Path, Query, Request, Response, Route, Security, Tags } from 'tsoa'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import type { Request as ExRequest } from 'express'
import type { XoVbd } from '@vates/types'

import { notFoundResp, unauthorizedResp, type Unbrand } from '../open-api/common/response.common.mjs'
import { partialVbds, vbd, vbdIds } from '../open-api/oa-examples/vbd.oa-example.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'

@Route('vbds')
@Security('*')
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('vbds')
@provide(VbdController)
export class VbdController extends XapiXoController<XoVbd> {
  constructor(@inject(RestApi) restApi: RestApi) {
    super('VBD', restApi)
  }

  /**
   *
   * @example fields "device,bootable,uuid"
   * @example filter "!bootable?"
   * @example limit 42
   */
  @Example(vbdIds)
  @Example(partialVbds)
  @Get('')
  getVbds(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoVbd>>> {
    return this.sendObjects(Object.values(this.getObjects({ filter, limit })), req)
  }

  /**
   *
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   */
  @Example(vbd)
  @Get('{id}')
  @Response(notFoundResp.status, notFoundResp.description)
  getVbd(@Path() id: string): Unbrand<XoVbd> {
    return this.getObject(id as XoVbd['id'])
  }
}
