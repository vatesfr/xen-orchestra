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
import type { XoAlarm, XoMessage, XoTask, XoVbd } from '@vates/types'

import { AlarmService } from '../alarms/alarm.service.mjs'
import { escapeUnsafeComplexMatcher } from '../helpers/utils.helper.mjs'
import { genericAlarmsExample } from '../open-api/oa-examples/alarm.oa-example.mjs'
import {
  asynchronousActionResp,
  badRequestResp,
  incorrectStateResp,
  internalServerErrorResp,
  noContentResp,
  notFoundResp,
  unauthorizedResp,
  type Unbrand,
} from '../open-api/common/response.common.mjs'
import type { CreateActionReturnType } from '../abstract-classes/base-controller.mjs'
import { partialVbds, vbd, vbdIds } from '../open-api/oa-examples/vbd.oa-example.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'
import { messageIds, partialMessages } from '../open-api/oa-examples/message.oa-example.mjs'
import { taskIds, taskLocation, partialTasks } from '../open-api/oa-examples/task.oa-example.mjs'

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

  /**
   * Hotplug the VBD, dynamically attaching it to the running VM
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   */
  @Example(taskLocation)
  @Post('{id}/actions/connect')
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(incorrectStateResp.status, 'VBD is already connected')
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  connectVbd(@Path() id: string, @Query() sync?: boolean): CreateActionReturnType<void> {
    const vbdId = id as XoVbd['id']
    const action = async () => {
      const xapiVbd = this.getXapiObject(vbdId)
      await xapiVbd.$xapi.callAsync('VBD.plug', xapiVbd.$ref)
    }

    return this.createAction<void>(action, {
      sync,
      statusCode: noContentResp.status,
      taskProperties: {
        name: 'connect VBD',
        objectId: vbdId,
      },
    })
  }

  /**
   * Hot-unplug the VBD, dynamically detaching it from the running VM
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   */
  @Example(taskLocation)
  @Post('{id}/actions/disconnect')
  @Middlewares(json())
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(incorrectStateResp.status, 'VBD is already disconnected')
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  disconnectVbd(
    @Path() id: string,
    @Body() body?: { force?: boolean },
    @Query() sync?: boolean
  ): CreateActionReturnType<void> {
    const vbdId = id as XoVbd['id']
    const force = body?.force ?? false

    const action = async () => {
      const xapiVbd = this.getXapiObject(vbdId)
      if (force) {
        try {
          await xapiVbd.$xapi.call('VBD.unplug_force', xapiVbd.$ref)
        } catch (error) {
          if ((error as { code?: string }).code !== 'VBD_NOT_UNPLUGGABLE') {
            throw error
          }
          await xapiVbd.$xapi.call('VBD.set_unpluggable', xapiVbd.$ref, true)
          await xapiVbd.$xapi.call('VBD.unplug_force', xapiVbd.$ref)
        }
      } else {
        await xapiVbd.$xapi.callAsync('VBD.unplug', xapiVbd.$ref)
      }
    }

    return this.createAction<void>(action, {
      sync,
      statusCode: noContentResp.status,
      taskProperties: {
        name: 'disconnect VBD',
        objectId: vbdId,
      },
    })
  }
}
