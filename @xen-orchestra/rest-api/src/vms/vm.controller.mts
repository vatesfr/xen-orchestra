import { Example, Get, Path, Post, Query, Request, Response, Route, Security, Tags, SuccessResponse } from 'tsoa'
import { Request as ExRequest } from 'express'
import { inject } from 'inversify'
import { incorrectState, invalidParameters } from 'xo-common/api-errors.js'
import { provide } from 'inversify-binding-decorators'
import type { XapiStatsGranularity, XapiVmStats, XoVm } from '@vates/types'
import { Task } from '@vates/task'

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
        /* throw */
        invalidParameters(`VM ${id} is halted or host could not be found.`, error)
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

  @Post('fakeTask')
  async fakeTake(@Query() sync?: boolean) {
    const sleep = () => new Promise(resolve => setTimeout(resolve, 2000))
    const action = async () => {
      Task.set('progress', 0)
      Task.info('Started')
      await sleep()
      Task.set('progress', 25)
      Task.info('info bar')
      await sleep()
      const subTask = new Task({ name: 'sub task', objectId: 'b61a5c92-700e-4966-a13b-00633f03eea8' as XoVm['id'] })
      await subTask.run(async () => {
        subTask.set('progress', 0)
        subTask.info('sub info')
        await sleep()
        subTask.set('progress', 50)
        await sleep()
        subTask.set('progress', 100)
        return 'subtask success'
      })
      Task.set('progress', 50)
      Task.warning('warn bar')
      await sleep()
      Task.set('progress', 75)
      Task.warning('warn baz')
      await sleep()
      Task.set('progress', 85)
      await sleep()
      Task.set('progress', 100)
    }

    return this.createAction(action, {
      sync,
      taskProperties: {
        name: 'fake task',
        objectId: 'b61a5c92-700e-4966-a13b-00633f03eea8' as XoVm['id'],
      },
    })
  }
}
