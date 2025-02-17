/* eslint-disable @typescript-eslint/no-unused-vars */

import { Controller, Get, Query, Request, Route } from 'tsoa'
import { provide } from 'inversify-binding-decorators'
import { inject } from 'inversify'
import { RestApi } from '../rest-api/rest-api.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'

import { Request as ExRequest } from 'express'
import type { XoVm } from '@vates/types/xo'
import { XenApiVm } from '@vates/types/xen-api'
import type { ALLOCATION_ALGORITHM } from '@vates/types/common'

type XoV = XoVm

@Route('vms')
// the `provide` decorator is mandatory on class that injects/receives dependencies.
// It automatically bind the class to the IOC container that handles dependency injection
@provide(VmController)
export class VmController extends Controller {
  //   constructor(@inject(RestApi) restApi: RestApi) {
  //     // super('VM', restApi)
  //   }

  /**
   *
   * @example fields "name_label,power_state"
   * @example filter "name_label:foo"
   * @example limit 42
   */
  @Get('test')
  test(@Request() req: ExRequest, @Query() fields?: string, @Query() filter?: string, @Query() limit?: number): XoVm {
    // const vms = this.getObjects({ filter, limit })
    // // const m = this.sendObjects(Object.values(vms), req)
    // return vms[0]
    return '' as any
  }
}
