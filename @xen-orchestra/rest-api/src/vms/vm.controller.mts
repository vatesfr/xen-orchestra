import { Example, Get, Path, Post, Query, Request, Response, Route, Security, Tags, SuccessResponse } from 'tsoa'
import { Request as ExRequest } from 'express'
import { inject } from 'inversify'
import { incorrectState, invalidParameters } from 'xo-common/api-errors.js'
import { provide } from 'inversify-binding-decorators'
import type { XapiStatsGranularity, XapiVmStats, XoVm } from '@vates/types'

import {
  actionAsyncroneResp,
  internalServerErrorResp,
  noContentResp,
  notFoundResp,
  unauthorizedResp,
  type Unbrand,
} from '../open-api/common/response.common.mjs'
import { partialVms, vm, vmIds, vmStatsExample } from '../open-api/oa-examples/vm.oa-example.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import { taskLocation } from '../open-api/oa-examples/task.oa-example.mjs'
import type { WithHref } from '../helpers/helper.type.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'

@Route('vms')
@Security('*')
@Response(unauthorizedResp.status, unauthorizedResp.description)
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
  ): string[] | WithHref<Partial<Unbrand<XoVm>>>[] {
    return this.sendObjects(Object.values(this.getObjects({ filter, limit })), req)
  }

  /**
   *
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   */
  @Example(vm)
  @Get('{id}')
  @Response(notFoundResp.status, notFoundResp.description)
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
  @Response(notFoundResp.status, notFoundResp.description)
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

  /**
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   */
  @Example(taskLocation)
  @Post('{id}/actions/start')
  @SuccessResponse(actionAsyncroneResp.status, actionAsyncroneResp.description, actionAsyncroneResp.produce)
  @Response(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  async startVm(@Path() id: string, @Query() sync?: boolean) {
    const vmId = id as XoVm['id']
    const action = () => this.getXapiObject(vmId).$callAsync('start', false, false)

    return this.createAction(action, {
      sync,
      statusCode: noContentResp.status,
      taskProperties: {
        name: 'start VM',
        objectId: vmId,
      },
    })
  }

  /**
   * Requires guest tools to be installed
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   */
  @Example(taskLocation)
  @Post('{id}/actions/clean_shutdown')
  @SuccessResponse(actionAsyncroneResp.status, actionAsyncroneResp.description, actionAsyncroneResp.produce)
  @Response(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  async cleanShutdownVm(@Path() id: string, @Query() sync?: boolean): Promise<string | void> {
    const vmId = id as XoVm['id']
    const action = async () => {
      await this.getXapiObject(vmId).$callAsync('clean_shutdown')
    }

    return this.createAction(action, {
      sync,
      statusCode: noContentResp.status,
      taskProperties: {
        name: 'clean shutdown VM',
        objectId: vmId,
      },
    })
  }

  /**
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   */
  @Example(taskLocation)
  @Post('{id}/actions/hard_shutdown')
  @SuccessResponse(actionAsyncroneResp.status, actionAsyncroneResp.description, actionAsyncroneResp.produce)
  @Response(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  async hardShutdownVm(@Path() id: string, @Query() sync?: boolean): Promise<string | void> {
    const vmId = id as XoVm['id']
    const action = async () => {
      await this.getXapiObject(vmId).$callAsync('hard_shutdown')
    }

    return this.createAction(action, {
      sync,
      statusCode: noContentResp.status,
      taskProperties: {
        name: 'hard shutdown VM',
        objectId: vmId,
      },
    })
  }
}
