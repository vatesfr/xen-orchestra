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
  Xapi,
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

import { acl } from '../middlewares/acl.middleware.mjs'
import { escapeUnsafeComplexMatcher } from '../helpers/utils.helper.mjs'
import { provide } from 'inversify-binding-decorators'
import { RestApi } from '../rest-api/rest-api.mjs'
import {
  asynchronousActionResp,
  badRequestResp,
  createdResp,
  internalServerErrorResp,
  invalidParameters as invalidParametersResp,
  noContentResp,
  forbiddenOperationResp,
  notFoundResp,
  unauthorizedResp,
  type Unbrand,
} from '../open-api/common/response.common.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'
import { invalidParameters } from 'xo-common/api-errors.js'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'
import { partialVifs, vif, vifId, vifIds } from '../open-api/oa-examples/vif.oa-example.mjs'
import { genericAlarmsExample } from '../open-api/oa-examples/alarm.oa-example.mjs'
import { AlarmService } from '../alarms/alarm.service.mjs'
import { messageIds, partialMessages } from '../open-api/oa-examples/message.oa-example.mjs'
import { taskIds, partialTasks, taskLocation } from '../open-api/oa-examples/task.oa-example.mjs'
import type { CreateActionReturnType } from '../abstract-classes/base-controller.mjs'

type UnbrandedXoVif = Unbrand<XoVif>

type CreateVifParams = Parameters<Xapi['VIF_create']>
type CreateVifBody = Omit<CreateVifParams[0], 'network' | 'VM'> &
  CreateVifParams[1] & {
    networkId: string
    vmId: string
  }

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
   * Returns all VIFs that match the following privilege:
   * - resource: vif, action: read
   *
   * @example fields "attached,id,device"
   * @example filter "attached?"
   * @example limit 42
   */
  @Example(vifIds)
  @Example(partialVifs)
  @Get('')
  @Security('*', ['acl'])
  getVifs(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() markdown?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<UnbrandedXoVif>> {
    return this.sendObjects(Object.values(this.getObjects({ filter })), req, {
      limit,
      privilege: { action: 'read', resource: 'vif' },
    })
  }

  /**
   * Required privilege:
   * - resource: vif, action: read
   *
   * @example id "f028c5d4-578a-332c-394e-087aaca32dd3"
   */
  @Example(vif)
  @Get('{id}')
  @Middlewares(acl({ resource: 'vif', action: 'read', objectId: 'params.id' }))
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  getVif(@Path() id: string): UnbrandedXoVif {
    return this.getObject(id as XoVif['id'])
  }

  /**
   * Returns all alarms that match the following privilege:
   * - resource: alarm, action: read
   *
   * @example id "f028c5d4-578a-332c-394e-087aaca32dd3"
   * @example fields "id,time"
   * @example filter "time:>1747053793"
   * @example limit 42
   */
  @Example(genericAlarmsExample)
  @Get('{id}/alarms')
  @Security('*', ['acl'])
  @Tags('alarms')
  @Response(notFoundResp.status, notFoundResp.description)
  getVifAlarms(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() markdown?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoAlarm>>> {
    const vif = this.getObject(id as XoVif['id'])
    const alarms = this.#alarmService.getAlarms({
      filter: `${escapeUnsafeComplexMatcher(filter) ?? ''} object:uuid:${vif.uuid}`,
    })

    return this.sendObjects(Object.values(alarms), req, {
      path: 'alarms',
      limit,
      privilege: { action: 'read', resource: 'alarm' },
    })
  }

  /**
   * Returns all messages that match the following privilege:
   * - resource: message, action: read
   *
   * @example id "f028c5d4-578a-332c-394e-087aaca32dd3"
   * @example fields "name,id,$object"
   * @example filter "name:VM_STARTED"
   * @example limit 42
   */
  @Example(messageIds)
  @Example(partialMessages)
  @Get('{id}/messages')
  @Security('*', ['acl'])
  @Tags('messages')
  @Response(notFoundResp.status, notFoundResp.description)
  getVifMessages(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() markdown?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoMessage>>> {
    const messages = this.getMessagesForObject(id as XoVif['id'], { filter })

    return this.sendObjects(Object.values(messages), req, {
      path: 'messages',
      limit,
      privilege: { action: 'read', resource: 'message' },
    })
  }

  /**
   * Returns all tasks that match the following privilege:
   * - resource: task, action: read
   *
   * @example id "f028c5d4-578a-332c-394e-087aaca32dd3"
   * @example fields "id,status,properties"
   * @example filter "status:failure"
   * @example limit 42
   */
  @Example(taskIds)
  @Example(partialTasks)
  @Get('{id}/tasks')
  @Security('*', ['acl'])
  @Tags('tasks')
  @Response(notFoundResp.status, notFoundResp.description)
  async getVifTasks(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() markdown?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoTask>>> {
    const tasks = await this.getTasksForObject(id as XoVif['id'], { filter })

    return this.sendObjects(Object.values(tasks), req, {
      path: 'tasks',
      limit,
      privilege: { action: 'read', resource: 'task' },
    })
  }

  /**
   * @example body {
   *  "networkId": "6b6ca0f5-6611-0636-4b0a-1fb1c1e96414",
   *  "vmId": "613f541c-4bed-fc77-7ca8-2db6b68f079c"
   * }
   */
  @Example(vifId)
  @Post('')
  @Middlewares(json())
  @SuccessResponse(createdResp.status, createdResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  @Response(invalidParametersResp.status, invalidParametersResp.description)
  async createVif(
    @Body()
    body: CreateVifBody
  ): Promise<{ id: Unbrand<XoVif>['id'] }> {
    const { MAC, vmId, networkId, ...rest } = body

    const vm = this.restApi.getObject<XoVm>(vmId as XoVm['id'], 'VM')
    const network = this.restApi.getObject<XoNetwork>(networkId as XoNetwork['id'], 'network')

    if (vm.$pool !== network.$pool) {
      throw invalidParameters(`the VM ${vmId} and network ${networkId} do not belong to the same pool`)
    }

    const xapi = this.getXapi(vmId as XoVm['id'])
    const vifRef = await xapi.VIF_create(
      {
        ...rest,
        VM: vm._xapiRef as XenApiVm['$ref'],
        network: network._xapiRef as XenApiNetwork['$ref'],
      },
      {
        MAC,
      }
    )

    const xapiVif = await xapi.barrier<XenApiVif>(vifRef)
    return { id: xapiVif.uuid }
  }

  /**
   * @example id "6b6ca0f5-6611-0636-4b0a-1fb1c1e96414"
   */
  @Delete('{id}')
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  async destroyVif(@Path() id: string): Promise<void> {
    const xapi = this.getXapi(id as XoVif['id'])
    await xapi.deleteVif(id as XoVif['id'])
  }

  /**
   * Hotplug the VIF, dynamically attaching it to the running VM
   * Requires PV drivers to be installed on the VM
   *
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   */
  @Example(taskLocation)
  @Post('{id}/actions/connect')
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  async connectVif(@Path() id: string, @Query() sync?: boolean): CreateActionReturnType<void> {
    const vifId = id as XoVif['id']

    const action = async () => {
      const xapi = this.getXapi(vifId)
      await xapi.connectVif(vifId)
    }

    return this.createAction<void>(action, {
      sync,
      statusCode: noContentResp.status,
      taskProperties: {
        name: 'connect VIF',
        objectId: vifId,
      },
    })
  }

  /**
   * Hot-unplug the VIF, dynamically detaching it from the running VM
   * Requires PV drivers to be installed on the VM
   *
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   */
  @Example(taskLocation)
  @Post('{id}/actions/disconnect')
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  async disconnectVif(@Path() id: string, @Query() sync?: boolean): CreateActionReturnType<void> {
    const vifId = id as XoVif['id']

    const action = async () => {
      const xapi = this.getXapi(vifId)
      await xapi.disconnectVif(vifId)
    }

    return this.createAction<void>(action, {
      sync,
      statusCode: noContentResp.status,
      taskProperties: {
        name: 'disconnect VIF',
        objectId: vifId,
      },
    })
  }
}
