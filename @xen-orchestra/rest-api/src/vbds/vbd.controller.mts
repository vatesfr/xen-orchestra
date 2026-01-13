import {
  Body,
  Delete,
  Example,
  Get,
  Middlewares,
  Path,
  Post,
  Query,
  Request,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from 'tsoa'
import { json } from 'express'
import { inject } from 'inversify'
import { invalidParameters as invalidParametersError } from 'xo-common/api-errors.js'
import { provide } from 'inversify-binding-decorators'
import type { Request as ExRequest } from 'express'
import type { Xapi, XoAlarm, XoMessage, XoTask, XoVbd, XoVdi, XoVm } from '@vates/types'

import { AlarmService } from '../alarms/alarm.service.mjs'
import { escapeUnsafeComplexMatcher } from '../helpers/utils.helper.mjs'
import { genericAlarmsExample } from '../open-api/oa-examples/alarm.oa-example.mjs'
import {
  badRequestResp,
  createdResp,
  invalidParameters,
  noContentResp,
  notFoundResp,
  unauthorizedResp,
  type Unbrand,
} from '../open-api/common/response.common.mjs'
import { BASE_URL } from '../index.mjs'
import { partialVbds, vbd, vbdId, vbdIds } from '../open-api/oa-examples/vbd.oa-example.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'
import { messageIds, partialMessages } from '../open-api/oa-examples/message.oa-example.mjs'
import { taskIds, partialTasks } from '../open-api/oa-examples/task.oa-example.mjs'

@Route('vbds')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('vbds')
@provide(VbdController)
export class VbdController extends XapiXoController<XoVbd> {
  #alarmService: AlarmService
  constructor(@inject(RestApi) restApi: RestApi, @inject(AlarmService) alarmService) {
    super('VBD', restApi)
    this.#alarmService = alarmService
  }

  /**
   * Create a VBD to attach a VDI to a VM
   *
   * @example body { "VM": "4fe90510-8da4-1530-38e2-a7876ef374c7", "VDI": "656052a2-2e3e-467b-88ba-63a9ea5e4a54", "bootable": false, "mode": "RW" }
   */
  @Example(vbdId)
  @Post('')
  @Middlewares(json())
  @SuccessResponse(createdResp.status, createdResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(invalidParameters.status, invalidParameters.description)
  async createVbd(
    @Body() body: Omit<Unbrand<Parameters<Xapi['VBD_create']>[0]>, 'VM' | 'VDI'> & { VM: string; VDI: string }
  ): Promise<{ id: string }> {
    const xoVm = this.restApi.getObject<XoVm>(body.VM as XoVm['id'], 'VM')
    const xoVdi = this.restApi.getObject<XoVdi>(body.VDI as XoVdi['id'], 'VDI')

    if (xoVm.$pool !== xoVdi.$pool) {
      throw invalidParametersError('VM and VDI must be in the same pool')
    }

    const xapiVm = this.restApi.getXapiObject<XoVm>(xoVm.id, 'VM')
    const xapiVdi = this.restApi.getXapiObject<XoVdi>(xoVdi.id, 'VDI')

    const xapi = xapiVm.$xapi

    const vbdRef = await xapi.VBD_create({
      ...body,
      VDI: xapiVdi.$ref,
      VM: xapiVm.$ref,
    })

    const vbdUuid = await xapi.call<string>('VBD.get_uuid', vbdRef)

    this.setHeader('Location', `${BASE_URL}/vbds/${vbdUuid}`)

    return { id: vbdUuid }
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

  /**
   * Delete a VBD
   *
   * Removes the virtual block device, detaching the VDI from the VM.
   * The VDI itself is NOT deleted.
   *
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   */
  @Delete('{id}')
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async deleteVbd(@Path() id: string): Promise<void> {
    const xapiVbd = this.getXapiObject(id as XoVbd['id'])
    await xapiVbd.$xapi.VBD_destroy(xapiVbd.$ref)
  }

  /**
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   * @example fields "id,time"
   * @example filter "time:>1747053793"
   * @example limit 42
   */
  @Example(genericAlarmsExample)
  @Get('{id}/alarms')
  @Tags('alarms')
  @Response(notFoundResp.status, notFoundResp.description)
  getVbdAlarms(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoAlarm>>> {
    const vbd = this.getObject(id as XoVbd['id'])
    const alarms = this.#alarmService.getAlarms({
      filter: `${escapeUnsafeComplexMatcher(filter) ?? ''} object:uuid:${vbd.uuid}`,
      limit,
    })

    return this.sendObjects(Object.values(alarms), req, 'alarms')
  }

  /**
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   * @example fields "name,id,$object"
   * @example filter "name:VM_STARTED"
   * @example limit 42
   */
  @Example(messageIds)
  @Example(partialMessages)
  @Get('{id}/messages')
  @Tags('messages')
  @Response(notFoundResp.status, notFoundResp.description)
  getVbdMessages(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoMessage>>> {
    const messages = this.getMessagesForObject(id as XoVbd['id'], { filter, limit })

    return this.sendObjects(Object.values(messages), req, 'messages')
  }

  /**
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   * @example fields "id,status,properties"
   * @example filter "status:failure"
   * @example limit 42
   */
  @Example(taskIds)
  @Example(partialTasks)
  @Get('{id}/tasks')
  @Tags('tasks')
  @Response(notFoundResp.status, notFoundResp.description)
  async getVbdTasks(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): Promise<SendObjects<Partial<Unbrand<XoTask>>>> {
    const tasks = await this.getTasksForObject(id as XoVbd['id'], { filter, limit })
    return this.sendObjects(Object.values(tasks), req, 'tasks')
  }
}
