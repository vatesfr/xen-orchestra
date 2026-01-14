import {
  Body,
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
import { provide } from 'inversify-binding-decorators'
import type { Request as ExRequest } from 'express'
import type { XoAlarm, XoMessage, XoTask, XoVbd, XoVdi, XoVm } from '@vates/types'

import { AlarmService } from '../alarms/alarm.service.mjs'
import { escapeUnsafeComplexMatcher } from '../helpers/utils.helper.mjs'
import { genericAlarmsExample } from '../open-api/oa-examples/alarm.oa-example.mjs'
import {
  badRequestResp,
  createdResp,
  invalidParameters,
  notFoundResp,
  unauthorizedResp,
  type Unbrand,
} from '../open-api/common/response.common.mjs'
import { BASE_URL } from '../index.mjs'
import { partialVbds, vbd, vbdId, vbdIds } from '../open-api/oa-examples/vbd.oa-example.mjs'
import type { CreateVbdBody } from './vbd.type.mjs'
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
   * @example body { "vm": "4fe90510-8da4-1530-38e2-a7876ef374c7", "vdi": "656052a2-2e3e-467b-88ba-63a9ea5e4a54", "bootable": false, "mode": "RW" }
   */
  @Example(vbdId)
  @Post('')
  @Middlewares(json())
  @SuccessResponse(createdResp.status, createdResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(invalidParameters.status, invalidParameters.description)
  async createVbd(@Body() body: CreateVbdBody): Promise<{ id: string }> {
    // Get XAPI objects (will throw 404 if not found)
    const xapiVm = this.restApi.getXapiObject<XoVm>(body.vm as XoVm['id'], 'VM')
    const xapiVdi = this.restApi.getXapiObject<XoVdi>(body.vdi as XoVdi['id'], 'VDI')

    const xapi = xapiVm.$xapi

    // Auto-select userdevice if not provided
    let userdevice = body.position
    if (userdevice === undefined) {
      const allowed = await xapi.call<string[]>('VM.get_allowed_VBD_devices', xapiVm.$ref)
      if (allowed.length === 0) {
        throw new Error('no allowed VBD devices')
      }
      userdevice = allowed[0]
      // Avoid position 3 if possible (reserved for CD drives)
      if (userdevice === '3' && allowed.length > 1) {
        userdevice = allowed[1]
      }
    }

    // Create VBD via XAPI
    const vbdRef = await xapi.call<string>('VBD.create', {
      bootable: body.bootable ?? false,
      empty: false,
      mode: body.mode ?? 'RW',
      other_config: {},
      qos_algorithm_params: {},
      qos_algorithm_type: '',
      type: 'Disk',
      unpluggable: false,
      userdevice,
      VDI: xapiVdi.$ref,
      VM: xapiVm.$ref,
    })

    // Get VBD UUID
    const vbdUuid = await xapi.call<string>('VBD.get_uuid', vbdRef)

    // Set Location header
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
