import { Example, Get, Path, Query, Request, Response, Route, Security, Tags } from 'tsoa'
import { Request as ExRequest } from 'express'
import { inject } from 'inversify'
import { incorrectState, invalidParameters } from 'xo-common/api-errors.js'
import { provide } from 'inversify-binding-decorators'
import type { XapiStatsGranularity, XapiVmStats, XoVm } from '@vates/types'

import { partialVms, vm, vmIds, vmStatsExample } from '../open-api/oa-examples/vm.oa-example.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import type { Unbrand, WithHref } from '../helpers/helper.type.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'

@Route('vms')
@Security('*')
@Response(401, 'Authentication required')
@Tags('vms')
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
  @Response(404, 'VM not found')
  getVm(@Path() id: string): Unbrand<XoVm> {
    return this.getObject(id as XoVm['id'])
  }

  /**
   *
   *  VM must be running
   *
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   */
  @Example(vmStatsExample)
  @Get('{id}/stats')
  @Response(404, 'VM not found')
  @Response(422, 'Invalid granularity, VM is halted or host could not be found')
  async getVmStats(@Path() id: string, @Query() granularity?: XapiStatsGranularity): Promise<XapiVmStats> {
    try {
      return await this.restApi.xoApp.getXapiVmStats(id as XoVm['id'], granularity)
    } catch (error) {
      if (
        incorrectState.is(error, {
          property: 'resident_on',
        })
      ) {
        /* throw */ invalidParameters(`VM ${id} is halted or host could not be found.`, error)
      }
      throw error
    }
  }
}
