import { Example, Get, Path, Query, Request, Response, Route, Security, Tags } from 'tsoa'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import type { Request as ExRequest } from 'express'
import type { XoVbd } from '@vates/types'

import { partialVbds, vbd, vbdIds } from '../open-api/oa-examples/vbd.oa-example.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import type { Unbrand, WithHref } from '../helpers/helper.type.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'

@Route('vbds')
@Security('*')
@Response(401, 'Authentication required')
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
    @Query() filter?: string,
    @Query() limit?: number
  ): string[] | WithHref<Unbrand<XoVbd>>[] | WithHref<Partial<Unbrand<XoVbd>>>[] {
    return this.sendObjects(Object.values(this.getObjects({ filter, limit })), req)
  }

  /**
   *
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   */
  @Example(vbd)
  @Get('{id}')
  @Response(404, 'VBD not found')
  getVbd(@Path() id: string): Unbrand<XoVbd> {
    return this.getObject(id as XoVbd['id'])
  }
}
