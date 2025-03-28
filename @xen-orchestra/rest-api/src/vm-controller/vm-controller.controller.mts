import { inject } from 'inversify'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import type { XoVmController } from '@vates/types'
import { Example, Get, Path, Query, Request, Response, Route, Security, Tags } from 'tsoa'
import { Request as ExRequest } from 'express'

import { notFoundResp, unauthorizedResp, type Unbrand } from '../open-api/common/response.common.mjs'
import { provide } from 'inversify-binding-decorators'
import type { WithHref } from '../helpers/helper.type.mjs'
import {
  partialVmControllers,
  vmController,
  vmControllerIds,
} from '../open-api/oa-examples/vm-controller.oa-example.mjs'

@Route('vm-controllers')
@Security('*')
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('vms')
@provide(VmControllerController)
export class VmControllerController extends XapiXoController<XoVmController> {
  constructor(@inject(RestApi) restApi: RestApi) {
    super('VM-controller', restApi)
  }

  /**
   *
   * @example fields "type,uuid"
   * @example filter "power_state:Running"
   * @example limit 42
   */
  @Example(vmControllerIds)
  @Example(partialVmControllers)
  @Get('')
  getVmControllers(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() filter?: string,
    @Query() limit?: number
  ): string[] | WithHref<Partial<Unbrand<XoVmController>>>[] {
    return this.sendObjects(Object.values(this.getObjects({ filter, limit })), req)
  }

  /**
   * @example id "9b4775bd-9493-490a-9afa-f786a44caa4f"
   */
  @Example(vmController)
  @Get('{id}')
  @Response(notFoundResp.status, notFoundResp.description)
  getVmController(@Path() id: string): Unbrand<XoVmController> {
    return this.getObject(id as XoVmController['id'])
  }
}
