import { Example, Get, Path, Query, Request, Response, Route, Security } from 'tsoa'
import { Request as ExRequest } from 'express'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import type { XoVm } from '@vates/types'

import { partialVms, vm, vmIds } from '../open-api/examples/vm.example.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import type { Unbrand, WithHref } from '../helpers/helper.type.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'

@Route('vms')
@Security('*')
@Response(401)
// the `provide` decorator is mandatory on class that injects/receives dependencies.
// It automatically bind the class to the IOC container that handles dependency injection
@provide(VmController)
export class VmController extends XapiXoController<XoVm> {
  constructor(@inject(RestApi) restApi: RestApi) {
    super('VM', restApi)
  }

  /**
   *
   * @example fields "name_label,power_state,uuid"
   * @example filter "power_state:Running"
   * @example limit 42
   */
  @Example(vmIds)
  @Example(partialVms)
  @Get('')
  getVms(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() filter?: string,
    @Query() limit?: number
  ): string[] | WithHref<Unbrand<XoVm>>[] | WithHref<Partial<Unbrand<XoVm>>>[] {
    return this.sendObjects(Object.values(this.getObjects({ filter, limit })), req)
  }

  /**
   *
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   */
  @Example(vm)
  @Get('{id}')
  @Response(404)
  getVm(@Path() id: string): Unbrand<XoVm> {
    return this.getObject(id as XoVm['id'])
  }
}
