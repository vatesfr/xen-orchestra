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
import { inject } from 'inversify'
import { json, type Request as ExRequest } from 'express'
import type {
  VIF_LOCKING_MODE,
  XenApiNetwork,
  XenApiVif,
  XenApiVm,
  XoAlarm,
  XoMessage,
  XoNetwork,
  XoTask,
  XoVif,
  XoVm,
} from '@vates/types'

import { escapeUnsafeComplexMatcher } from '../helpers/utils.helper.mjs'
import { provide } from 'inversify-binding-decorators'
import { RestApi } from '../rest-api/rest-api.mjs'
import {
  asynchronousActionResp,
  badRequestResp,
  createdResp,
  internalServerErrorResp,
  notFoundResp,
  unauthorizedResp,
  type Unbrand,
} from '../open-api/common/response.common.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'
import { partialVifs, vif, vifIds } from '../open-api/oa-examples/vif.oa-example.mjs'
import { genericAlarmsExample } from '../open-api/oa-examples/alarm.oa-example.mjs'
import { AlarmService } from '../alarms/alarm.service.mjs'
import { messageIds, partialMessages } from '../open-api/oa-examples/message.oa-example.mjs'
import { taskIds, partialTasks } from '../open-api/oa-examples/task.oa-example.mjs'
import { CreateActionReturnType } from '../abstract-classes/base-controller.mjs'

type UnbrandedXoVif = Unbrand<XoVif>

@Route('vifs')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('vifs')
@provide(VifController)
export class VifController extends XapiXoController<XoVif> {
  #alarmService: AlarmService
  constructor(@inject(RestApi) restApi: RestApi, @inject(AlarmService) alarmService: AlarmService) {
    super('VIF', restApi)
    this.#alarmService = alarmService
  }

  /**
   * @example fields "attached,id,device"
   * @example filter "attached?"
   * @example limit 42
   */
  @Example(vifIds)
  @Example(partialVifs)
  @Get('')
  getVifs(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<UnbrandedXoVif>> {
    return this.sendObjects(Object.values(this.getObjects({ filter, limit })), req)
  }

  /**
   * @example id "f028c5d4-578a-332c-394e-087aaca32dd3"
   */
  @Example(vif)
  @Get('{id}')
  @Response(notFoundResp.status, notFoundResp.description)
  getVif(@Path() id: string): UnbrandedXoVif {
    return this.getObject(id as XoVif['id'])
  }

  /**
   * @example id "f028c5d4-578a-332c-394e-087aaca32dd3"
   * @example fields "id,time"
   * @example filter "time:>1747053793"
   * @example limit 42
   */
  @Example(genericAlarmsExample)
  @Get('{id}/alarms')
  @Tags('alarms')
  @Response(notFoundResp.status, notFoundResp.description)
  getVifAlarms(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoAlarm>>> {
    const vif = this.getObject(id as XoVif['id'])
    const alarms = this.#alarmService.getAlarms({
      filter: `${escapeUnsafeComplexMatcher(filter) ?? ''} object:uuid:${vif.uuid}`,
      limit,
    })

    return this.sendObjects(Object.values(alarms), req, 'alarms')
  }

  /**
   * @example id "f028c5d4-578a-332c-394e-087aaca32dd3"
   * @example fields "name,id,$object"
   * @example filter "name:VM_STARTED"
   * @example limit 42
   */
  @Example(messageIds)
  @Example(partialMessages)
  @Get('{id}/messages')
  @Tags('messages')
  @Response(notFoundResp.status, notFoundResp.description)
  getVifMessages(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoMessage>>> {
    const messages = this.getMessagesForObject(id as XoVif['id'], { filter, limit })

    return this.sendObjects(Object.values(messages), req, 'messages')
  }

  /**
   * @example id "f028c5d4-578a-332c-394e-087aaca32dd3"
   * @example fields "id,status,properties"
   * @example filter "status:failure"
   * @example limit 42
   */
  @Example(taskIds)
  @Example(partialTasks)
  @Get('{id}/tasks')
  @Tags('tasks')
  @Response(notFoundResp.status, notFoundResp.description)
  async getVifTasks(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): Promise<SendObjects<Partial<Unbrand<XoTask>>>> {
    const tasks = await this.getTasksForObject(id as XoVif['id'], { filter, limit })

    return this.sendObjects(Object.values(tasks), req, 'tasks')
  }

  /**
   * @example vmId "613f541c-4bed-fc77-7ca8-2db6b68f079c"
   * @example networkId "6b6ca0f5-6611-0636-4b0a-1fb1c1e96414"
   */
  @Post('')
  @Middlewares(json())
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  async createVif(
    @Query() vmId: string,
    @Query() networkId: string,
    @Body()
    body: {
      currently_attached: boolean
      device?: string
      ipv4_allowed: string[]
      ipv6_allowed: string[]
      locking_mode: VIF_LOCKING_MODE
      MTU: number
      other_config: Record<string, string>
      qos_algorithm_params: Record<string, string>
      qos_algorithm_type: string
      MAC: string
    }
  ): Promise<{ vifRef: Unbrand<XenApiVif>['$ref'] }> {
    const xapi = this.getXapi(networkId as XoNetwork['id'])
    const vm = this.restApi.getObject<XoVm>(vmId as XoVm['id'], 'VM')
    const network = this.restApi.getObject<XoNetwork>(networkId as XoNetwork['id'], 'network')

    const vifRef = await xapi.VIF_create(
      {
        currently_attached: body.currently_attached,
        device: body.device ?? undefined,
        ipv4_allowed: body.ipv4_allowed,
        ipv6_allowed: body.ipv6_allowed,
        locking_mode: body.locking_mode,
        MTU: body.MTU,
        network: network._xapiRef as XenApiNetwork['$ref'],
        other_config: body.other_config,
        qos_algorithm_params: body.qos_algorithm_params,
        qos_algorithm_type: body.qos_algorithm_type,
        VM: vm._xapiRef as XenApiVm['$ref'],
      },
      {
        MAC: body.MAC,
      }
    )

    return { vifRef }
  }

  /**
   * @example id "6b6ca0f5-6611-0636-4b0a-1fb1c1e96414"
   */
  @Delete('{id}')
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  async destroyVif(@Path() id: string): Promise<void> {
    const xapi = this.getXapi(id as XoVif['id'])
    await xapi.deleteVif(id)
  }
}
